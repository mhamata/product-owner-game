# Product Owner Game (PRAXIS)

A web-based product-management simulation for interview prep, Scrum/PO training, and PM skill-building.

## 📁 Folder structure

```
Product Owner Game/
├── README.md              ← this file (project overview + handoff prompt)
├── prd/                   ← Product Requirements Document
│   ├── PRAXIS_PRD_v1.html (editable source)
│   └── PRAXIS_PRD_v1.pdf  (rendered)
├── scenarios/             ← game scenarios (one file per scenario)
│   ├── 01_canadian_launch.html    (consumer-facing Moomoo)
│   ├── 02_clearing_pipeline.html  (Moomoo interview-specific — clearing/settlement)
│   └── …                  (future scenarios)
├── methods/               ← PM tools & methods reference
│   └── pm_methods_reference.html
├── engine/                ← game engine algorithms + data model
├── ui-mockups/            ← visual design artifacts
└── notes/                 ← decision logs, playthroughs, interview prep notes
```

## 🎯 Current objective

**Build a personal interview-prep tool for Mike's Moomoo Senior PM interview (Brokerage Clearing & Settlement System) in 4–5 days.** Once validated, consider commercialization.

## ✅ What's done

- [x] PRD v1.0 complete (24 sections)
- [x] Scenario 01 — The Canadian Launch (consumer-facing Moomoo)
- [x] Scenario 02 — The Clearing Pipeline (Moomoo interview role)
- [x] PM Methods reference
- [x] Engine algorithms doc
- [ ] Next.js scaffold + playable v1 (in progress — `app/`)

## 🚀 Starting a new Claude Code session — handoff prompt

When you open a fresh Claude Code session, paste this as your first message:

---

> I'm building PRAXIS — a product-management simulation for interview prep. The project lives at `/Users/zazu/Desktop/Product Owner Game/`.
>
> Context:
> - I'm preparing for a Senior PM interview at Moomoo for a Brokerage Clearing and Settlement System role
> - I have 13 years of experience at Questrade across brokerage ops, treasury, FX, risk, and credit
> - I'm familiar with DTCC, OCC, CDS/CDCC, Broadridge workflows
> - The MVP target is a playable single-player game I can use myself to rehearse PM decisions before the interview
> - After the interview, if the tool is useful, I'll consider commercializing it
>
> Start by reading:
> 1. `prd/PRAXIS_PRD_v1.html` — the full product vision
> 2. `scenarios/01_canadian_launch.html` — first scenario (consumer-facing)
> 3. `scenarios/02_clearing_pipeline.html` — second scenario (matches the actual role)
> 4. `methods/pm_methods_reference.html` — PM tools (T-shirt sizing, RICE, Kano, etc.) to incorporate in gameplay
>
> Then produce a week-1 build plan: Next.js + Prisma scaffold, game engine core, first playable scenario.

---

## 🎓 Learning goals

PM skills the game must rehearse for the Moomoo interview:

- Brokerage trade lifecycle (capture → clearing → settlement → custody)
- Regulated product decisions (CIRO, provincial commissions, SEC/FINRA)
- Vendor-facing PM (DTCC, OCC, CDS, Broadridge integrations)
- Operational stakeholders (Ops, Risk, Compliance, Treasury)
- Post-trade reconciliation + break resolution
- Incident response for settlement failures
- Prioritization frameworks (RICE, WSJF, Kano, T-shirt sizing, MoSCoW)
- Discovery methods (Jobs-to-be-Done, user interviews, observational research)

## 📅 4–5 day interview-prep sprint

| Day | Deliverable |
|---|---|
| Sun (today) | Folder setup · Scenario 02 · PM methods reference |
| Mon | New Claude Code session · Next.js scaffold · game engine core |
| Tue | Iteration planning UI · event firing · customer inbox |
| Wed | AI retrospective (Claude API) · polish · first full playthrough |
| Thu | Second scenario loaded · 3× playthroughs with different strategies |
| Fri | Interview rehearsal · review retros · note decisions for behavioral questions |

## 🔑 Key decisions made

- **Auth:** none for MVP (single-user, localhost)
- **Payments:** none for MVP
- **Multiplayer:** none for MVP
- **Persistence:** localStorage or flat-file JSON; no database needed
- **AI:** Claude Opus 4.7 for retrospectives only; rules-based engine for events (no AI-generated events in MVP)
- **UI:** Tailwind + shadcn/ui + dnd-kit (functional > pretty for v1)
- **Deploy:** Vercel or local only

## 📝 Notes

- BVG (Business Value Game)
- JSON Resume format already in `/Users/zazu/Desktop/job-ops/Mike_Hamata_Resume.json`
- Moomoo JD: https://apply.workable.com/moomoo/j/242F4CFF48/ (Senior PM — Brokerage Clearing & Settlement)
