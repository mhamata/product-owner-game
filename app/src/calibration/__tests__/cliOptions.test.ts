import { describe, expect, it } from 'vitest';
import { CliUsageError, parseArgs } from '../cliOptions';

/**
 * The calibrate CLI's argument parsing, pulled out of `scripts/calibrate.ts`
 * so it is testable without invoking the real CLI (which calls `main()` as a
 * side effect on import). Covers the `--grader` flag added for the Phase-1
 * panel study (docs/PHASE1.md Decisions: "add --grader v2 to the calibrate
 * CLI").
 */

describe('parseArgs', () => {
  it('defaults grader to v1 when the flag is omitted', () => {
    const options = parseArgs([]);
    expect(options.grader).toBe('v1');
    expect(options).toEqual({ dry: false, runs: 1, grader: 'v1' });
  });

  it('accepts --grader v1 explicitly', () => {
    expect(parseArgs(['--grader', 'v1']).grader).toBe('v1');
  });

  it('accepts --grader v2 explicitly', () => {
    expect(parseArgs(['--grader', 'v2']).grader).toBe('v2');
  });

  it('throws a CliUsageError for an invalid --grader value', () => {
    expect(() => parseArgs(['--grader', 'v3'])).toThrow(CliUsageError);
    expect(() => parseArgs(['--grader', 'v3'])).toThrow(/Invalid --grader value/);
  });

  it('throws a CliUsageError when --grader is the last argument (no value)', () => {
    expect(() => parseArgs(['--grader'])).toThrow(CliUsageError);
  });

  it('still rejects unknown arguments with a CliUsageError', () => {
    expect(() => parseArgs(['--bogus'])).toThrow(CliUsageError);
    expect(() => parseArgs(['--bogus'])).toThrow(/Unknown argument: --bogus/);
  });

  it('combines --grader with the other existing flags', () => {
    const options = parseArgs(['--dry', '--type', 'prd-artifact', '--runs', '3', '--limit', '5', '--grader', 'v2']);
    expect(options).toEqual({
      dry: true,
      type: 'prd-artifact',
      runs: 3,
      limit: 5,
      grader: 'v2',
    });
  });
});
