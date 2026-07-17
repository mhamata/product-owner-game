# Go-live runbook — smoke tests, calibration, panelists

*Prepared 2026-07-16. Everything below is sequenced so Mike can run it top-to-bottom in one sitting (except panelist turnaround). The AI smoke harness (`npm run smoke:ai`) is already verified end-to-end in degrade mode — 6/6 surfaces — so a live failure means the key/config, not the harness.*

---

## 0. Keys (Mike, ~5 min)

Add to `app/.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...        # console.anthropic.com
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # supabase dashboard -> project praxis -> API keys
```

**⚠️ The one trap:** dev servers spawned through Claude Code inherit a bogus injected `ANTHROPIC_API_KEY` that SHADOWS `.env.local` (process env wins in Next.js). Start the server from a **plain terminal**:

```bash
cd app && npm run dev
```

or, if launching through the harness, wrap it (`env -u` strips the injection so `.env.local`'s real key loads — correct for both live and degrade testing):

```bash
env -u ANTHROPIC_API_KEY -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN npm run dev
```

## 1. AI smoke test (~10 min, ≈6 Haiku calls, pennies)

With the server running and the key in place:

```bash
cd app && npm run smoke:ai -- --expect live
```

Covers all six surfaces through the full route stack (rate limit → validate → budget → model → normalize): interview reply, interview scorecard, artifact grading v1 (calibration-frozen path) and v2 (inline annotations), interview-ammo STAR stories, QBR meeting. Expect `6/6 surfaces serve live`.

- A `null`-shaped soft failure (scorecard/stories/meeting null) means the model's JSON didn't parse — rerun once before treating it as real.
- Then eyeball two flows in the browser for feel, not correctness: one `/interview` session end-to-end (reply latency, scorecard evidence chips), and one PRD grade via `/learn/prd-artifact` (annotation cards render on your actual text).
- Optional negative test: put one wrong character in the key, restart, run any AI surface — you should see the calm "the AI key was rejected" message, never raw provider JSON. Fix the key back.

## 2. Purchase smoke test (~20 min, Mike present — test mode, no real money)

Prereqs in `.env.local`: `STRIPE_SECRET_KEY` (test mode), `STRIPE_PRICE_SPRINT`, `STRIPE_PRICE_MONTHLY` (create test products/prices in the Stripe dashboard if not yet done), `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and for this test set `PRAXIS_AUTH_MODE=required`.

1. Forward webhooks locally (new terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
   Put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart the dev server.
2. `/account` → sign in with email one-time code (works with zero Supabase dashboard config).
3. `/upgrade` → pick a plan → checkout with card `4242 4242 4242 4242`, any future expiry/CVC.
4. Verify the grant landed (Supabase SQL editor):
   ```sql
   select product, status, current_period_end from entitlements order by updated_at desc limit 3;
   select tier, cents_cap, cents_used from user_budgets order by updated_at desc limit 3;
   ```
   Expect an active `interview-gym` entitlement and the budget row at the paid tier (not `free`/15).
5. Then confirm an AI call works while signed in (run any `/interview` turn) — this exercises the JWT + budget reserve/settle path end-to-end.
6. Set `PRAXIS_AUTH_MODE` back to `off` for local dev afterwards.

## 3. Calibration dress rehearsal (~5 min, ≈$0.03)

Structural dry-run is already green (2026-07-16: 30 golden items). With the key in place:

```bash
cd app && npm run calibrate            # ~30 Haiku calls against both synthetic raters
```

Read the report it writes under `app/calibration-output/` (md + json). This proves the harness end-to-end; the numbers are drift-tracking only — **the company go/no-go gate only counts once golden-set provenance is `panel`** (see `docs/PHASE0.md`).

## 4. Panelists (start same day — the long pole, expect 1–3 weeks turnaround)

The blind pack is freshly regenerated (2026-07-16): `app/calibration-output/panel/reading-pack.md` (30 items) + `scores.csv`. Panelist instructions: `docs/calibration/panel-guide.md`. Recruiting post: `docs/calibration/recruiting-post.md`.

Recommended plan:
- **Target 3–5 senior PMs** (hiring-manager experience preferred), **$150–250 each** for ~2–3 hours of blind scoring.
- **Venues, in order of signal:** (1) your own network / former colleagues — fastest and highest trust; (2) Lenny's Slack `#hiring` / PM communities; (3) a LinkedIn post using `recruiting-post.md`; (4) Mind the Product / Product School communities.
- Draft DM to paste:
  > I'm calibrating an AI grader for PM work samples (PRDs, experiment plans, strategy memos) and paying senior PMs $150–250 to blind-score 30 short samples against a rubric — ~2–3 hours, async, your scores get compared against the model's. Interested?
- Per returned CSV: `npm run panel:import -- --csv <path> --rater panel-1` (`--dry` first to validate; increment `panel-2`, `panel-3`, ...).
- After 3+ panelists: rerun `npm run calibrate`, judge against the gates in `agreement.ts` (adjacent ≥ 0.90, QWK ≥ 0.60 and within 0.10 of the panel's own inter-rater QWK, pass/fail ≥ 0.85), and **publish the agreement rate either way** — that's the honesty gate for the "calibrated grader" claim.

## 5. Deploy (after 1–4 pass)

Follow `docs/PHASE1.md` "Next actions": Vercel deploy with all env vars, live-mode Stripe products + production webhook endpoint (4 events), Supabase Google/Apple OAuth + production SMTP, `PRAXIS_AUTH_MODE=required`.
