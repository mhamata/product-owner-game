import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GOLDEN_SET, validateGoldenSet } from '../src/calibration/goldenSet';
import { ARTIFACT_CONTENT } from '../src/curriculum/artifacts';
import { industryContext } from '../src/calibration/runner';
import { resolveArtifact } from '../src/curriculum/artifacts';

/**
 * PANEL WORKBOOK EXPORT: what you hand to each paid senior-PM rater.
 *
 *   npm run panel:workbook
 *
 * Writes calibration-output/panel/:
 *   - reading-pack.md   every submission with its brief and rubric, in scoring
 *                       order, WITHOUT any existing scores (raters stay blind)
 *   - scores.csv        one row per item x criterion for spreadsheet scoring
 *
 * When the scored CSVs come back, add each rater to the golden-set items as
 * { raterId: 'panel-<initials>', criteria, pass } and flip provenance to
 * 'panel'. (An import script is worth writing when the first CSV arrives —
 * format may shift after contact with real panelists.)
 */

const problems = validateGoldenSet();
if (problems.length > 0) {
  console.error('Golden set is malformed; fix before exporting:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const outDir = join(process.cwd(), 'calibration-output', 'panel');
mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------------------------
   reading-pack.md — blind reading order groups by artifact type so raters
   grade like-for-like in one sitting (rubric context-switching is where
   human raters get noisy).
   ------------------------------------------------------------------ */
const md: string[] = [];
md.push('# Praxis calibration panel — reading pack');
md.push('');
md.push(
  'Score each submission against its rubric using the 0-3 band per criterion ' +
    '(0 = missing/off-track, 1 = attempted but weak, 2 = solid/meets the bar, 3 = excellent/exceeds the bar), ' +
    'then give an overall pass/fail: pass means "this work meets the bar for the deliverable overall." ' +
    'Judge only what is written. Enter scores in scores.csv. Please do not discuss items with other raters until both of you have submitted.',
);
md.push('');

const types = [...new Set(GOLDEN_SET.map((i) => i.artifactSkillId))];
for (const type of types) {
  const content = ARTIFACT_CONTENT[type];
  const items = GOLDEN_SET.filter((i) => i.artifactSkillId === type);

  md.push(`## ${content.title}`);
  md.push('');
  md.push('### The rubric you are scoring against');
  for (const c of content.rubric) {
    md.push(`- **${c.label}** (\`${c.id}\`): ${c.descriptor}`);
  }
  if (content.graderInstructions) {
    md.push('');
    md.push(`_Additional guidance:_ ${content.graderInstructions}`);
  }
  md.push('');

  for (const item of items) {
    const resolved = resolveArtifact(content, industryContext(item.industry));
    md.push(`### ${item.id}`);
    md.push('');
    md.push(`_The brief this writer received (${resolved.scenarioTag}):_`);
    md.push('');
    for (const p of resolved.brief) md.push(`> ${p}`);
    md.push('');
    md.push('_Submission:_');
    md.push('');
    md.push(item.submission);
    md.push('');
    md.push('---');
    md.push('');
  }
}
writeFileSync(join(outDir, 'reading-pack.md'), md.join('\n'));

/* ------------------------------------------------------------------
   scores.csv — one row per item x criterion, plus one pass/fail row per item.
   ------------------------------------------------------------------ */
const rows: string[] = ['item_id,artifact_type,criterion_id,criterion_label,score_0_to_3'];
for (const item of GOLDEN_SET) {
  const content = ARTIFACT_CONTENT[item.artifactSkillId];
  for (const c of content.rubric) {
    rows.push(`${item.id},${item.artifactSkillId},${c.id},"${c.label}",`);
  }
  rows.push(`${item.id},${item.artifactSkillId},OVERALL_PASS,"pass or fail",`);
}
writeFileSync(join(outDir, 'scores.csv'), rows.join('\n'));

console.log(`Wrote ${join(outDir, 'reading-pack.md')} (${GOLDEN_SET.length} items) and scores.csv`);
