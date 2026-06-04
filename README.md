# Praxis

A gamified product-management trainer that takes you from zero to senior-operator judgment, one short rep at a time. Pick a home industry, work a leveled skill map, and practice the way real PMs are tested: writing artifacts, defending decisions to stakeholders, and running a product through a full cycle.

Live: https://product-owner-game-mhamata-personal1.vercel.app

## What it is

Most PM courses are videos you watch. Praxis is reps you do. The whole thing is built around demonstrated competence: you do not advance by finishing lessons, you advance by showing you can apply the skill. Progress is a mastery score, never a count of attempts.

It is industry-generic by design. Choose SaaS, Fintech, Marketplace, Consumer, or Healthcare as your home industry and the examples, personas, and scenarios reskin to match, while the underlying skill stays the same.

## What you practice

- **A leveled skill map.** Six levels from Foundations to VP, built on a twelve-competency spine (execution, insight, strategy, influence, plus the cross-cutting business, technical, design, communication, and ethics threads).
- **Concept lessons and drills.** Short, focused teaching followed by bite-size drills that are graded against the skill, with examples flavored to your home industry.
- **AI-graded artifacts.** Write the real deliverables a PM is judged on (a PRD, a strategy memo, an experiment plan, a north-star tree, a positioning statement) and get scored feedback.
- **Stakeholder roleplay.** An AI character pushes back (a skeptical VP, an engineering lead, a demanding customer, a peer PM) and you practice holding a position under pressure.
- **A judgment deck.** Spaced-repetition decision cards that resurface on a Leitner schedule so the calls you got wrong come back until they stick.
- **A decision simulation.** A self-teaching capstone where you run a product through planning, shipping, outcomes, and events, then get a retro on the choices you made.
- **Specialization tracks.** Seven deeper tracks once the core ladder is under you: growth, platform and API, AI and ML, monetization, marketplace, B2B and B2C, and zero-to-one.

Certification, an adaptive test-out for skills you already have, and a competency matrix that shows where you are strong and where you are thin round it out.

## Tech

- **Next.js 16** (App Router, Turbopack) and **React 19**
- **TypeScript** end to end
- **Tailwind CSS v4** for the Console design system
- **Zustand 5** with persistence for all learner state (no account needed, everything is local)
- **Anthropic SDK** for artifact grading and roleplay
- **Vitest** for the test suite
- **Zod** for runtime validation at the API boundary

## Run it locally

```bash
cd app
npm install      # first time only
npm run dev      # http://localhost:3000
```

```bash
npm test         # run the test suite
npm run typecheck
npm run build
```

## AI features and the key

Artifact grading and roleplay call the Anthropic API. To turn them on, add a key to `app/.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key, the app still runs end to end. The AI features degrade to a calm "unavailable" state and save your work as a draft instead of grading it, so nothing breaks and no calls go out. Every AI route is cost-bounded either way: a per-client rate limit, a token cap per call, a turn cap the client cannot reset, and a hard global daily ceiling.

## Project layout

```
Product Owner Game/
├── app/                 the product (Next.js)
│   └── src/
│       ├── app/         routes (learn, review, progress, play, api)
│       ├── components/  the Console UI (map, lessons, sim, review)
│       ├── curriculum/  levels, skills, lessons, drills, artifacts, roleplay, judgment
│       ├── scenarios/   simulation scenarios
│       ├── store/       Zustand stores (learn, review, industry)
│       └── lib/         shared utilities (rate limiting, grading helpers)
└── design/              redesign previews (Console direction + sim direction)
```
