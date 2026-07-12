# Phase 0 — Status ledger & runbook

*The go/no-go gate from [MASTER_PLAN.md](MASTER_PLAN.md) §2 and §9. This file is the durable state for cold-starting any future session: what exists, how to run it, what's next.*

## What's built (2026-07-07)

### Workstream A — Grading calibration harness ✅ code-complete
| Piece | Where | State |
|---|---|---|
| Grading core (extracted from route; study and product share one grader) | `app/src/lib/artifactGrader.ts` | ✅ |
| Golden set: 30 items (10 PRD / 10 experiment plan / 10 strategy memo), 4 quality bands × 5 industries, 2 synthetic raters each (`seed-author`, `seed-blind`) | `app/src/calibration/goldenSet/` | ✅ `provenance: synthetic-seed` — **panel scores still required for the real gate** |
| Agreement math: exact/adjacent/MAE, quadratic-weighted kappa, Cohen's kappa, grader-vs-rater + rater-vs-rater pairs, go/no-go gates | `app/src/calibration/agreement.ts` | ✅ unit-tested |
| Runner (concurrency, retries, multi-run variance) + report (md + json) | `app/src/calibration/runner.ts`, `report.ts` | ✅ |
| CLI | `npm run calibrate` (`-- --dry`, `--type`, `--runs N`, `--limit N`) | ✅ dry-run verified; **live run blocked on ANTHROPIC_API_KEY** |
| Panel workbook export (blind reading pack + scores.csv) | `npm run panel:workbook` → `app/calibration-output/panel/` | ✅ verified |
| Panelist guide + recruiting posts | `docs/calibration/` | ✅ |

Go/no-go gates encoded in `agreement.ts` (`DEFAULT_GATES`): adjacent ≥ 0.90, QWK ≥ 0.60 AND within 0.10 of the panel's own inter-rater QWK, pass/fail agreement ≥ 0.85. Gates only count once golden-set provenance is `panel`.

### Workstream B — Supabase substrate ✅ deployed
- **Project:** `praxis` (`dkciotyvrcepopwgtowe`), ca-central-1, $10/mo, ACTIVE_HEALTHY. URL: `https://dkciotyvrcepopwgtowe.supabase.co`.
- **Schema applied** (also in repo: `supabase/migrations/20260707000000_phase0_substrate.sql`): `learner_state` (Zustand snapshot sync), `exercise_events` (append-only), `competency_state`, `mentor_memory`, `entitlements`, `user_budgets`, `usage_events`; atomic `reserve_budget`/`settle_budget` functions (security-definer, service-role-only). RLS on everything; clients read own rows, write only low-stakes surfaces. Supabase security advisors: clean.
- **App integration:** `app/src/lib/supabase/server.ts` (JWT verify + service client), `app/src/lib/budget.ts` (cost-normalized cents, reserve→settle→log). Wired into `grade-artifact` route behind `PRAXIS_AUTH_MODE` (default `off` = today's behavior unchanged; `required` = JWT + monthly allowance; reservation placed immediately before the spend and settled back on failure).
- **Env:** see `app/.env.example`. Service-role key must be fetched from the Supabase dashboard (never committed).

### Verification state
`npm run typecheck` clean · `npm test` 416/416 across 24 files (incl. new agreement + golden-set suites) · `npm run calibrate -- --dry` OK · `npm run panel:workbook` OK · adversarial code review: **CLEAN** (0 high, 0 medium; 2 informational notes, both by-design — kappa math independently reproduced, no reservation-leak paths, SQL race-safe, RLS holes none).

## Not done yet (Phase 0 remainder — human tasks mostly)
1. **Add `ANTHROPIC_API_KEY` to `app/.env.local`**, then run `npm run calibrate` — full dress rehearsal (~30 Haiku calls, ≈$0.03) against both synthetic raters. Wire into CI after first green run.
2. **Recruit 3–5 senior-PM panelists** (posts in `docs/calibration/recruiting-post.md`, $150–250 each), send `calibration-output/panel/` pack.
3. ~~**Import panel CSVs** into the golden set (add `panel-*` raters, flip `provenance` to `panel`) — write the import script when the first CSV arrives.~~ ✅ `npm run panel:import -- --csv <path> --rater panel-1` (`--dry` to validate without writing). See `app/src/calibration/panelImport.ts` for the import contract (validation, seed-rater replacement, provenance flip) and `docs/calibration/panel-guide.md` for what panelists return. Run once per panelist (`panel-1`, `panel-2`, ...); scores accumulate.
4. **Run the real gate** and decide go/no-go per the thresholds. Publish the agreement rate either way.
5. Supabase dashboard config (not schema): enable anonymous sign-ins, Apple/Google providers — needed in Phase 1/2, not for the calibration study.
6. Commit the work (branch `claude/zen-davinci-6754c5`).

## Cold-start pointers
- Strategy: `docs/MASTER_PLAN.md` (+ 9 research docs in `docs/research/`)
- Grading contract: `app/src/lib/artifactGrader.ts` — **any change invalidates prior calibration; re-run `npm run calibrate`**
- Golden-set provenance rule: `synthetic-seed` runs are drift-tracking only; the company gate needs `panel`
- Budget gate semantics: reserve worst-case → call → settle actual; monthly rollover self-heals leaks; caps live in `user_budgets.cents_cap` (free default 15¢)
