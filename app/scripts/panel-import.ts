import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GOLDEN_SET } from '../src/calibration/goldenSet';
import { PRD_GOLDEN } from '../src/calibration/goldenSet/prd';
import { EXPERIMENT_GOLDEN } from '../src/calibration/goldenSet/experiment';
import { MEMO_GOLDEN } from '../src/calibration/goldenSet/memo';
import { CliUsageError, parsePanelImportArgs } from '../src/calibration/cliOptions';
import { runPanelImport, serializeGoldenSetSource, type GoldenSetFileGroup } from '../src/calibration/panelImport';

/**
 * PANEL IMPORT: turn one panelist's scored `scores.csv` into golden-set
 * mutations (see `docs/calibration/panel-guide.md` for what panelists
 * receive and return, and `src/calibration/panelImport.ts` for the full
 * import contract — validation rules, seed-replacement, provenance flip).
 *
 *   npm run panel:import -- --csv path/to/scores.csv --rater panel-1
 *   npm run panel:import -- --csv path/to/scores.csv --rater panel-1 --dry
 *
 * Run once per panelist (`--rater panel-1`, `--rater panel-2`, ...); scores
 * accumulate across invocations. Validates the whole CSV before writing
 * anything — on any problem, prints every one, exits 2, and touches no
 * files.
 */

function main() {
  let options;
  try {
    options = parsePanelImportArgs(process.argv.slice(2));
  } catch (e) {
    if (e instanceof CliUsageError) {
      console.error(e.message);
      process.exit(2);
    }
    throw e;
  }

  // resolve() (not join()) so an absolute --csv path is used as-is, and a
  // relative one resolves against the directory `npm run panel:import` is
  // invoked from.
  const csvPath = resolve(process.cwd(), options.csv);
  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(2);
  }
  const csvText = readFileSync(csvPath, 'utf8');

  const groups: GoldenSetFileGroup[] = [
    { filePath: join(process.cwd(), 'src/calibration/goldenSet/prd.ts'), arrayName: 'PRD_GOLDEN', items: PRD_GOLDEN },
    {
      filePath: join(process.cwd(), 'src/calibration/goldenSet/experiment.ts'),
      arrayName: 'EXPERIMENT_GOLDEN',
      items: EXPERIMENT_GOLDEN,
    },
    { filePath: join(process.cwd(), 'src/calibration/goldenSet/memo.ts'), arrayName: 'MEMO_GOLDEN', items: MEMO_GOLDEN },
  ];

  const result = runPanelImport(GOLDEN_SET, groups, options.rater, csvText);
  if (result.problems.length > 0) {
    console.error(
      `Import rejected (${result.problems.length} problem${result.problems.length === 1 ? '' : 's'}); no files touched:`,
    );
    for (const p of result.problems) console.error(`  - ${p}`);
    process.exit(2);
  }

  const summary = result.summary!;
  const newGroups = result.groups!;

  if (!options.dry) {
    for (const g of newGroups) {
      const original = readFileSync(g.filePath, 'utf8');
      const rewritten = serializeGoldenSetSource(original, g.arrayName, g.items);
      writeFileSync(g.filePath, rewritten);
    }
  }

  console.log(options.dry ? 'Dry run: validation passed. No files written.' : `Wrote ${newGroups.length} golden-set file(s).`);
  console.log('');
  console.log(`Rater: ${summary.raterId}`);
  console.log(`Items updated (${summary.updatedItemIds.length}): ${summary.updatedItemIds.join(', ') || '(none)'}`);
  console.log(
    `Items still synthetic (${summary.stillSyntheticIds.length}): ${summary.stillSyntheticIds.join(', ') || '(none)'}`,
  );
  console.log(`Raters now on file: ${summary.raterIdsOnFile.join(', ')}`);
}

main();
