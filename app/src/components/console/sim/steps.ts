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
