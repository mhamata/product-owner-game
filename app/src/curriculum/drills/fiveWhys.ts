/**
 * 5-Whys drill: STRUCTURAL CORE (industry-neutral).
 *
 * The /methods library keeps the open-ended "write your own whys" version. For
 * the Console lesson we use a DETERMINISTIC variant: the five causes are given
 * shuffled and the learner orders them surface → root.
 *
 * This file owns the answer key: the canonical ORDER of the step ids (surface
 * symptom first → organizational root last). That order is the graded answer
 * and is IDENTICAL for every industry. It carries NO human-readable copy. The
 * symptom, each cause's `text`, and each cause's `layer` live in
 * `./fiveWhys.display`, one pack per home industry, merged on by
 * `resolveFiveWhysDrill`.
 *
 * The core discipline survives the re-skin: every industry's chain runs from a
 * technical surface cause down to an organizational/ownership root, so "don't
 * stop at the first human-error cause" stays the lesson.
 */

/** The structural step ids, IN CANONICAL ORDER (surface → root). */
export type FiveWhysStepId = 's1' | 's2' | 's3' | 's4' | 's5';

/**
 * The canonical surface-to-root ordering of the step ids. This array's ORDER is
 * the answer; `gradeSequencing` scores a learner's ordering against it.
 */
export const fiveWhysStructure: { order: FiveWhysStepId[] } = {
  order: ['s1', 's2', 's3', 's4', 's5'],
};
