# Praxis — Current-State Audit (July 2026)

Full codebase audit of what the game is today and where it falls short as a learning product. (Condensed; counts verified against `app/src/`.)

## What exists

### Curriculum
- **6-level career ladder** (Foundations → Associate → PM → Senior → Staff/Principal → Director/VP), core/IC/management branches — `app/src/curriculum/data.ts`.
- **80 ladder skills (49 ready, 31 coming-soon) + 18 track skills** across 7 specialization tracks (Growth, Platform/API, AI-ML, Monetization, Marketplace, B2B/B2C, Zero-to-One).
- **12-competency spine** (execution, insight, strategy, influence + business/technical/design/communication/ethics threads).
- **59 lessons** (concept + industry-flavored example + check questions), **12 drill types** (RICE, Kano, WSJF, value-effort, t-shirt sizing deterministic; JTBD, Mom Test, Five Whys, PR-FAQ, pre-mortem LLM-graded), **5 AI-graded artifacts** with visible rubrics (one-page PRD, experiment plan, north-star tree, positioning statement, strategy memo), **4 roleplay scenarios** (scope-cut, defend roadmap, customer escalation, say no), **80 judgment cards** on Leitner spaced repetition (6 boxes, 0–35 day intervals).
- **5 industry reskins** (SaaS, Fintech, Marketplace, Consumer, Healthcare) via a data-driven `Flavoured<T>` system.
- **Placement test-out** per level (80% bar) — `app/src/curriculum/placement.ts`.

### Simulation engine (`app/src/engine/`, `engine/engine_algorithms.md`)
- Deterministic (seeded PRNG), turn-based: capacity **ranges** (not points), tech debt 0–100 with thresholds, customer archetypes with happiness/engagement state machines, stakeholder trust, team morale, events (forced / state-gated / weighted-random), calibration predictions with lifetime accuracy, 6-axis radar scoring, Opus-written retrospective.
- **5 scenarios** (2 deep: product launch, regulated launch; 3 skeletal: turnaround, zero-to-one, scaling crunch); shared events pool ~20–30.

### AI features & cost controls (production-grade)
- `/api/grade-artifact` (Haiku, per-criterion rubric scoring), `/api/roleplay` (Haiku reply + score, server-enforced turn caps), `/api/retro` (Opus).
- 3-layer defense: per-client rate limits, per-call token caps, global daily ceiling; graceful no-key degradation (drafts saved, calm "unavailable" states) — `app/src/lib/rateLimit.ts`.

### Learning mechanics
- Mastery = best-of-attempts, threshold 1.0 (`learnStore`); Leitner scheduler (`reviewStore`); calibration accuracy (`calibrationStore`); dismissible coachmarks (`coachStore`).

## Honest strengths
1. Sound learning science: mastery-based progression, spaced repetition, calibration training, rubric-aligned grading.
2. Sophisticated sim mechanics — genuinely good turn-based game bones (pure `step(state, action)` function, trivially save/resumable and replayable).
3. Professionally authored content; elegant industry skinning (one codebase, 5 skins).
4. Production-grade AI cost controls.

## Honest gaps

| Area | Gap |
|---|---|
| **Accounts** | All state is localStorage; no sync, no history, no identity, progress lost on browser clear |
| **Mobile** | Desktop-only viewport; drag-and-drop breaks on touch; no responsive design |
| **Onboarding** | No FTUE, no narrative, no tutorial scenario |
| **Retention** | Streak tracked but not surfaced; no notifications, achievements, leagues, or social |
| **Monetization** | None — no tiers, no paywall, no entitlements |
| **Content depth** | 49/80 ladder skills playable; ethics 1 skill, communication/design/product-ops ~0; only 2 deep sim scenarios; events repeat within 2–3 plays |
| **Adaptivity** | No adaptive difficulty; no cross-modality feedback (judgment misses don't inform sim or lessons) |
| **Credential** | No certification output, no shareable/verifiable anything |
| **Modalities** | Everything is generative-from-blank-page or multiple-choice; no evaluative/reactive practice (critique a bad PRD, read a dashboard, handle an incident) |

## Verdict
A strong prototype with world-class mechanics — not yet a product. The four prerequisites for credibility: accounts + sync, mobile-first design, an onboarding flow, and retention/monetization loops. See `docs/MASTER_PLAN.md` for the reinvention plan.
