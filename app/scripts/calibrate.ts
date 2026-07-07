import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { GOLDEN_SET, validateGoldenSet } from '../src/calibration/goldenSet';
import { gradeGoldenSet } from '../src/calibration/runner';
import { buildReport, renderMarkdown } from '../src/calibration/report';
import type { GoldenArtifactType } from '../src/calibration/types';

/**
 * THE PHASE-0 CALIBRATION RUN.
 *
 *   npm run calibrate                 grade the whole golden set once
 *   npm run calibrate -- --dry        validate the golden set, no API calls
 *   npm run calibrate -- --type prd-artifact
 *   npm run calibrate -- --runs 3     grade every item 3x (variance check)
 *   npm run calibrate -- --limit 5    first N items only (smoke test)
 *
 * Reads ANTHROPIC_API_KEY from the environment (or app/.env.local). Writes
 * calibration-output/report.md + report.json. Exit code 1 when any evaluable
 * gate fails — CI-friendly, but remember: gates on synthetic-seed provenance
 * are drift tracking, not the go/no-go evidence.
 */

interface CliOptions {
  dry: boolean;
  type?: GoldenArtifactType;
  runs: number;
  limit?: number;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { dry: false, runs: 1 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry') options.dry = true;
    else if (arg === '--type') options.type = argv[++i] as GoldenArtifactType;
    else if (arg === '--runs') options.runs = Math.max(1, Number(argv[++i]) || 1);
    else if (arg === '--limit') options.limit = Math.max(1, Number(argv[++i]) || 1);
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

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
  const options = parseArgs(process.argv.slice(2));

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
  console.log(`Golden set: ${items.length} items (${provenances.join(', ')}) · runs per item: ${options.runs}`);

  if (options.dry) {
    console.log('Dry run: golden set is structurally sound. No API calls made.');
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
    onProgress: (done, total) => {
      process.stdout.write(`\r  graded ${done}/${total}`);
    },
  });
  process.stdout.write('\n');
  console.log(`Graded ${runs.length} runs in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  // 3) Report.
  const report = buildReport(items, runs);
  const outDir = join(process.cwd(), 'calibration-output');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(outDir, 'report.md'), renderMarkdown(report));
  console.log(`Wrote ${join(outDir, 'report.md')} and report.json`);

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
