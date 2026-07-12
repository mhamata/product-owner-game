import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_GATES } from '../src/calibration/agreement';
import { CliUsageError, parseArgs, type CliOptions } from '../src/calibration/cliOptions';
import { GOLDEN_SET, validateGoldenSet } from '../src/calibration/goldenSet';
import { gradeGoldenSet } from '../src/calibration/runner';
import { buildReport, renderMarkdown } from '../src/calibration/report';

/**
 * THE PHASE-0 CALIBRATION RUN.
 *
 *   npm run calibrate                    grade the whole golden set once (grader v1, frozen)
 *   npm run calibrate -- --dry           validate the golden set, no API calls
 *   npm run calibrate -- --type prd-artifact
 *   npm run calibrate -- --runs 3        grade every item 3x (variance check)
 *   npm run calibrate -- --limit 5       first N items only (smoke test)
 *   npm run calibrate -- --grader v2     grade with gradeArtifactV2 instead of the frozen v1 contract
 *
 * Reads ANTHROPIC_API_KEY from the environment (or app/.env.local). Writes
 * calibration-output/report.md + report.json (grader v1) or report.v2.md +
 * report.v2.json (grader v2, so it never overwrites the frozen v1 baseline).
 * Exit code 1 when any evaluable gate fails — CI-friendly, but remember:
 * gates on synthetic-seed provenance are drift tracking, not the go/no-go
 * evidence.
 */

/**
 * Next.js loads .env.local for the app; this CLI runs outside Next, so mirror
 * just enough of that behavior to find the key without adding a dependency.
 */
function loadEnvLocal() {
  if (process.env.ANTHROPIC_API_KEY) return;
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

async function main() {
  loadEnvLocal();

  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (e) {
    if (e instanceof CliUsageError) {
      console.error(e.message);
      process.exit(2);
    }
    throw e;
  }

  // 1) Integrity first: never spend against a malformed golden set.
  const problems = validateGoldenSet();
  if (problems.length > 0) {
    console.error(`Golden set is malformed (${problems.length} problems):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  let items = GOLDEN_SET;
  if (options.type) items = items.filter((i) => i.artifactSkillId === options.type);
  if (options.limit) items = items.slice(0, options.limit);

  const provenances = [...new Set(items.map((i) => i.provenance))];
  // The v1 default keeps this line byte-for-byte identical to before the
  // --grader flag existed; the grader note only appears for v2.
  const graderNote = options.grader === 'v2' ? ' · grader: v2' : '';
  console.log(
    `Golden set: ${items.length} items (${provenances.join(', ')}) · runs per item: ${options.runs}${graderNote}`,
  );

  if (options.dry) {
    const dryGraderNote = options.grader === 'v2' ? ' (grader v2)' : '';
    console.log(`Dry run${dryGraderNote}: golden set is structurally sound. No API calls made.`);
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(
      'ANTHROPIC_API_KEY is not set. Export it (or put it in app/.env.local and run via `npm run calibrate`).',
    );
    process.exit(1);
  }

  // 2) Grade with the production grading core.
  const client = new Anthropic({ apiKey });
  const started = Date.now();
  const runs = await gradeGoldenSet(client, items, {
    runs: options.runs,
    concurrency: 4,
    grader: options.grader,
    onProgress: (done, total) => {
      process.stdout.write(`\r  graded ${done}/${total}`);
    },
  });
  process.stdout.write('\n');
  console.log(`Graded ${runs.length} runs in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  // 3) Report. v2 gets its own filenames (`report.v2.*`) so it never
  // overwrites the frozen v1 baseline report.
  const report = buildReport(items, runs, DEFAULT_GATES, options.grader);
  const reportBase = options.grader === 'v2' ? 'report.v2' : 'report';
  const outDir = join(process.cwd(), 'calibration-output');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${reportBase}.json`), JSON.stringify(report, null, 2));
  writeFileSync(join(outDir, `${reportBase}.md`), renderMarkdown(report));
  console.log(`Wrote ${join(outDir, `${reportBase}.md`)} and ${reportBase}.json`);

  // 4) Gate summary to stdout + exit code.
  console.log('');
  for (const gate of report.overallGates) {
    const verdict = gate.passed === null ? '—' : gate.passed ? 'PASS' : 'FAIL';
    console.log(`  [${verdict}] ${gate.gate}: ${gate.actual} (target ${gate.target})`);
  }
  if (report.provenance !== 'panel') {
    console.log(
      '\n⚠️  Provenance is not "panel": this run exercises the harness / tracks drift. ' +
        'The Phase-0 go/no-go needs real senior-PM panel scores (docs/calibration/panel-guide.md).',
    );
  }
  const failed = report.overallGates.some((g) => g.passed === false);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
