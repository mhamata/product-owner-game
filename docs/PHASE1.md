# Phase 1 — Status ledger (Interview Gym wedge, web-first)

*Per [MASTER_PLAN.md](MASTER_PLAN.md) §9 Phase 1. Cold-start state: what's built, what's in flight, what's next.*

## Slices

| Slice | What | State |
|---|---|---|
| **A — Interview engine** | Content model + 2 authored cases (`ps-renter-maintenance` product-sense, `ex-dau-drop` execution with earn-the-data reveals) + `/api/interview` (reply + hiring-committee scorecard, evidence anchored to numbered candidate turns). Brief resolved server-side (contains case answers). Budget-gated like grade-artifact. | ✅ committed `27d905a` |
| **A2 — Interview UI** | `/interview` case picker + session page (localStorage resume, turn counter) + committee scorecard with evidence chips that jump to numbered transcript turns; nav link added | ✅ merged `aff259f` |
| **B — Grading v2** | `artifactGraderV2` (block-anchored inline annotations, ≤8, ≥1 praise, topFix) + revision mode (delta: addressed/ignored/regressions) + route `v: 2` path + artifact UI (annotation cards, revise-resubmit ≤3 versions, delta view, v2 default). v1 grader untouched — calibration depends on it. | ✅ merged `7cafad6` (route hand-merged: builder forked from main, its route lacked the Phase-0 gates; resolved into the gated structure) |
| **C — Readiness report** | Aggregate graded artifacts + interview scorecards into a shareable report (PDF) | ⬜ next session |
| **D — Checkout** | Stripe product ($99 six-week Interview Sprint / $39 mo, 3-day trial), checkout route, webhook → `entitlements`, flip `PRAXIS_AUTH_MODE=required` for payers | ⬜ needs Mike's Stripe account |
| **E — Auth UI** | `/account` page (email one-time-code + Google/Apple OAuth, calm fallback until providers enabled) + progress sync to `learner_state`: pure tested planner — first sign-in with an empty server pushes all local progress (the anonymous→account migration); thereafter server wins on sign-in + debounced push-on-change; clears propagate as tombstone UPDATEs (table has no DELETE policy). Allowlist = the 8 Zustand persist keys + `praxis:artifact-v2:*` / `praxis:interview:*` raw families (slice C needs that graded history). Bearer headers added to all 7 AI fetch sites — flipping `PRAXIS_AUTH_MODE=required` needs no further client work. Degrades calmly with Supabase env unset. | ✅ committed `d078e20` (branch `claude/hungry-shaw-0b3d07` — continues from `864408e`) |

## Decisions made
- **One model tier (Haiku) for interviewer + scorer** until calibration data justifies Sonnet on scoring; budget helpers price unknown models at Sonnet-tier, so upgrading is a one-line change.
- **Interview cases are NOT industry-flavoured** (identical cases keep scores comparable; a mock interview should feel like someone else's company).
- **Scoring scale** stays the Praxis 0-3 band, mapped onto committee language: 0 no-hire signal · 1 lean no · 2 lean hire · 3 strong hire. Overall recommendation derived server-side from the rollup, never trusted from the model.
- **Grading v2 lives beside v1**, not in it — `artifactGrader.ts` is frozen for calibration continuity. When the wedge ships on v2, the panel study must target v2 (add `--grader v2` to the calibrate CLI then).
- **Auth is cookie-free** (slice E): plain `supabase-js` in the browser (PKCE, localStorage session), `Authorization: Bearer` to the API routes — no `@supabase/ssr`. Sync conflict rule is server-wins-on-sign-in with continuous push while signed in; the accepted v1 edge (signed-out progress after a prior sync can lose to an older server copy) is documented in `app/src/lib/sync/planner.ts`.

## Next actions
1. Slice D (Stripe — needs Mike's account + price IDs) and slice C (readiness report — graded history now syncs, so it can be server- or client-composed).
2. Supabase dashboard (Mike): enable Google + Apple OAuth providers (email code sign-in already works with zero config); production SMTP later.
3. Live smoke test of `/api/interview` + auth flow once `ANTHROPIC_API_KEY` lands in `app/.env.local` (still missing — also blocks the calibration dress rehearsal, see [PHASE0.md](PHASE0.md)). To try accounts locally: `cp app/.env.example app/.env.local`.
