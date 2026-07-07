import { serviceClient } from '@/lib/supabase/server';

/**
 * Per-user AI budget gate (layer 4 of the cost defenses; layers 1-3 — client
 * rate limit, per-call token caps, global ceiling — live in rateLimit.ts).
 *
 * Pattern: RESERVE pessimistically before the model call (worst-case cost),
 * SETTLE with the real cost after. The `reserve_budget` / `settle_budget`
 * Postgres functions are atomic and service-role-only, so concurrent requests
 * cannot race past the cap and clients cannot move their own numbers.
 *
 * Costs are tracked in COST-NORMALIZED CENTS, not tokens, so model routing
 * changes never require cap migrations. Estimates round UP: a reserve that is
 * slightly generous and settles down is safe; the reverse is a leak.
 */

/** Mid-2026 per-MTok pricing, in cents, for cost normalization. */
const MODEL_PRICING_CENTS: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 100, output: 500 },
};
const DEFAULT_PRICING = { input: 300, output: 1500 }; // Sonnet-tier, conservative

/** Worst-case cents for a call, from char-count input + max output tokens. */
export function estimateCallCents(model: string, inputChars: number, maxOutputTokens: number): number {
  const pricing = MODEL_PRICING_CENTS[model] ?? DEFAULT_PRICING;
  const inputTokens = Math.ceil(inputChars / 3.5); // conservative chars-per-token
  const cents =
    (inputTokens / 1_000_000) * pricing.input + (maxOutputTokens / 1_000_000) * pricing.output;
  return Math.max(1, Math.ceil(cents)); // never reserve zero; the floor keeps abuse costly
}

/** Actual cents from the response's real token usage. */
export function actualCallCents(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING_CENTS[model] ?? DEFAULT_PRICING;
  const cents =
    (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
  return Math.ceil(cents);
}

/** True when the user has allowance for the estimate (and it was reserved). */
export async function reserveBudget(userId: string, estimateCents: number): Promise<boolean> {
  const { data, error } = await serviceClient().rpc('reserve_budget', {
    p_user: userId,
    p_estimate_cents: estimateCents,
  });
  if (error) throw new Error(`reserve_budget failed: ${error.message}`);
  return data === true;
}

export async function settleBudget(
  userId: string,
  reservedCents: number,
  actualCents: number,
): Promise<void> {
  const { error } = await serviceClient().rpc('settle_budget', {
    p_user: userId,
    p_reserved_cents: reservedCents,
    p_actual_cents: actualCents,
  });
  if (error) throw new Error(`settle_budget failed: ${error.message}`);
}

/** Append to the usage audit log. Never throws: logging must not break grading. */
export async function logUsage(entry: {
  userId: string | null;
  route: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCents: number;
}): Promise<void> {
  try {
    await serviceClient().from('usage_events').insert({
      user_id: entry.userId,
      route: entry.route,
      model: entry.model,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      estimated_cents: entry.estimatedCents,
    });
  } catch {
    // Swallow: an unavailable audit log should degrade to "no log", not "no product".
  }
}
