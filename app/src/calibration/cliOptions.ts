import type { GoldenArtifactType } from './types';

/**
 * CALIBRATE CLI ARGUMENT PARSING.
 *
 * Pulled out of `scripts/calibrate.ts` into its own pure module so it is
 * unit-testable: `scripts/calibrate.ts` calls `main()` as a side effect on
 * import (it is a CLI entry point invoked by `tsx`), so importing it from a
 * test file would kick off a real calibration run. This module has no side
 * effects — it only turns argv into options, or throws.
 */

/**
 * Which grading contract to measure.
 *  - `v1` (default): `gradeArtifact` in `artifactGrader.ts` — FROZEN, the
 *    Phase-0 calibration contract. Byte-for-byte unchanged by this flag.
 *  - `v2`: `gradeArtifactV2` in `artifactGraderV2.ts` — the version the paid
 *    wedge ships once it cuts over (see docs/PHASE1.md Decisions: "When the
 *    wedge ships on v2, the panel study must target v2").
 */
export type GraderVersion = 'v1' | 'v2';

export interface CliOptions {
  dry: boolean;
  type?: GoldenArtifactType;
  runs: number;
  limit?: number;
  grader: GraderVersion;
}

/** Thrown for any malformed CLI invocation; the caller prints `.message` and exits 2. */
export class CliUsageError extends Error {}

function isGraderVersion(value: string | undefined): value is GraderVersion {
  return value === 'v1' || value === 'v2';
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { dry: false, runs: 1, grader: 'v1' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry') options.dry = true;
    else if (arg === '--type') options.type = argv[++i] as GoldenArtifactType;
    else if (arg === '--runs') options.runs = Math.max(1, Number(argv[++i]) || 1);
    else if (arg === '--limit') options.limit = Math.max(1, Number(argv[++i]) || 1);
    else if (arg === '--grader') {
      const value = argv[++i];
      if (!isGraderVersion(value)) {
        throw new CliUsageError(
          `Invalid --grader value: ${value === undefined ? '(none)' : `"${value}"`}. Expected "v1" or "v2".`,
        );
      }
      options.grader = value;
    } else {
      throw new CliUsageError(`Unknown argument: ${arg}`);
    }
  }
  return options;
}
