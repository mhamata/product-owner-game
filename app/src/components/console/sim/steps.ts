// SUPERSEDED by InboxTurn (W2-D), kept for reference this wave. SimRunner no
// longer drives a linear step cursor off these names — the inbox presentation
// derives what to show directly from engine `phase` + `pendingEvents`, not a
// 6-step index. Nothing imports this module any more; left in place rather
// than deleted per this wave's "don't delete silently" rule.
//
// The six linear steps of the Guided Flow sim, mirroring sim-b.html. The order
// is load-bearing: SimRunner derives the active index from the engine phase, and
// the stepper/dock read these labels.

export const SIM_STEPS = ['Plan', 'Preview', 'Ship', 'Outcome', 'Event', 'Debrief'] as const;

export type SimStepName = (typeof SIM_STEPS)[number];

export const STEP_INDEX: Record<SimStepName, number> = {
  Plan: 0,
  Preview: 1,
  Ship: 2,
  Outcome: 3,
  Event: 4,
  Debrief: 5,
};
