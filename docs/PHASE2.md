# Phase 2+ — Sim 2.0 & learning-layer build ledger

*Cold-start state for the "complete the app" engagement (authorized by Mike 2026-07-12: "Complete the rest of the app the entire phases with all your recommendations start to finish"). Design authority: [design/design-sim-2.0.md](design/design-sim-2.0.md) + the two approved mockups beside it. This ledger tracks the build slices; update it every wave.*

**Scope ruling:** this engagement builds every web-side recommendation. It does NOT build the Capacitor iOS shell (gated on Phase 1 wedge results per MASTER_PLAN §9 — unchanged), and cannot run anything requiring `ANTHROPIC_API_KEY`/`SUPABASE_SERVICE_ROLE_KEY` live (Mike-gated; all AI surfaces ship with the standard calm degrade). Cred/economy is deliberately deferred until the loop proves itself — the mockups show it; the build omits it (open question #6).

## Slices

| Slice | What | State |
|---|---|---|
| W1-A | Engine people roster v1: named people (trust, mood, agenda, memory) deterministic from scenario+seed; trust effects through the event system. Engine-only. | 🔨 building |
| W1-B | App-wide light/dark theme tokens (design doc §3 table) + `/standup` 3-act home (due cards → scheduler-picked block → sim cliffhanger). | 🔨 building |
| W2-C | Engine board confidence + expectations + fired fail-state + end-of-season summary + deterministic job-market offers. Engine-only. | ✅ `engine/board.ts`: confidence (deterministic start, bounded per-sprint deltas, `board-confidence` EventEffect), 3 expectations, `fired` phase (floor 30, reachable only from review), `deriveSeasonSummary`/`deriveJobMarketOffers` selectors. 34 new tests, all gates green. |
| W2-D | Sim presentation rebuild: inbox turn (messages from people, decision sheets w/ telegraphed effects, rationale, commit→cliffhanger). | ✅ `InboxTurn.tsx` is now the sim experience at `/play/[scenarioId]`: Plan/event messages from `state.people` (trust bars, role labels), bottom-sheet decisions reusing `telegraphImpacts`/`deriveEventBeats`/(moved+exported) `summarizeEventEffects`, one-line rationale on the Commit sheet (same `decisionLogStore` capture as PR #10), cliffhanger with a "peek now" escape hatch, `OutcomeStep`/`DebriefStep` reused (lightly restyled, `hideStepBadge`) for the post-cliffhanger/next-visit review. `PreviewStep`/`ShipStep`/`EventStep`/`SimStepper`/`SimContextRail`/`SimScoreboard`/`PredictionCard`/`steps.ts` marked superseded (kept, not deleted). Handles W2-C's concurrently-landed `fired` phase with a placeholder (full UI is W3-F) and its `board-confidence` EventEffect in the effect chips. 15 new tests (explain.test.ts pure-logic + InboxTurn.test.tsx render/integration via the real engine reducer); no pre-existing render tests existed to adapt. All gates green (typecheck, 744/744 tests, lint at the 8-problem baseline, build, both leak greps empty). |
| W3-E | Product map screen (districts, health, debt hatching) + metric tiles with decision annotations. | ⬜ |
| W3-F | Season screen: timeline, board meter, roster, QBR, fired→offers flow. | ⬜ |
| W4-G | Fog-of-war: dashboard panes gated on `isMastered()`, unlock hints name the skill. | ⬜ |
| W4-H | Mastery decay (rusty + 90s refresh) + skill map as tech tree with in-sim unlock lines. | ⬜ |
| W4-I | Drill player card-stack + review deck (Leitner shelf, provenance chips) per mockups. | ⬜ |
| W5-J | Multi-party QBR AI route (guardrail stack, degrade) + in-sim graded-artifact moments modulating engine risk. | ⬜ |
| W5-K | Shared learner model v0: emit `exercise_events` when signed in (RLS append-own already allows it). | ⬜ |

## Standing build rules (every slice)
- Sonnet builders, leading no-delegation rule, reports to scratch files; Fable line-reviews AI/money surfaces and the engine's state-migration points.
- Frozen: `artifactGrader.ts`, `stripe.ts`, `entitlements.ts`, `budget.ts`, existing route guardrail order. New AI routes clone the interview route's stack in the same order.
- Engine stays a pure seeded reducer; additive optional state only (old persisted `GameState` snapshots must keep loading). All AI is garnish — outcomes engine-computed.
- Gates per slice: typecheck · full test suite green · lint = the 8 pre-existing baseline problems only · (UI slices) build + both bundle-leak greps empty.
- Old sim presentation (6-step `SimRunner`) is REPLACED by W2-D/W3 — engine and its tests untouched; component tests adapted, not deleted silently.

## Decisions this engagement
- No feature flag for the sim rebuild: pre-launch, no sim users; the wedge surfaces (`/interview`, `/artifact`, checkout) are untouched by every slice.
- Theme default = system preference; explicit toggle persists (`data-theme` on root); game surfaces use the same tokens as the rest of the app.
- Cred/XP economy deferred (see scope ruling).

## Open questions carried from design doc §7
Career File naming · board-confidence tuning · firing UX severity · rationale-capture friction · Career File export server-side vs browser-side · (new) Cred economy timing.

## Session log
- 2026-07-12: engagement started. Branch `claude/sim2-wave1` from `acd6f24`. W1-A + W1-B launched.
