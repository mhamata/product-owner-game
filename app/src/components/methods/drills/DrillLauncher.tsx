'use client';

import type { DrillType } from '@/methods';
import { RiceDrill } from './RiceDrill';
import { MomTestDrill } from './MomTestDrill';
import { MoscowDrill } from './MoscowDrill';
import { KanoDrill } from './KanoDrill';
import { TShirtDrill } from './TShirtDrill';
import { WsjfDrill } from './WsjfDrill';
import { FiveWhysDrill } from './FiveWhysDrill';
import { JtbdDrill } from './JtbdDrill';
import { PreMortemDrill } from './PreMortemDrill';
import { PrFaqDrill } from './PrFaqDrill';

export function DrillLauncher({ drillType }: { drillType: DrillType }) {
  return (
    <section className="p-5 bg-blue-50 border-2 border-blue-300 rounded-lg">
      <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">
        🎯 Interactive Drill
      </div>
      <h3 className="text-lg font-semibold text-blue-950 mb-3">Practice this method</h3>
      {drillType === 'rice' && <RiceDrill />}
      {drillType === 'mom-test' && <MomTestDrill />}
      {drillType === 'moscow' && <MoscowDrill />}
      {drillType === 'kano' && <KanoDrill />}
      {drillType === 't-shirt' && <TShirtDrill />}
      {drillType === 'wsjf' && <WsjfDrill />}
      {drillType === 'five-whys' && <FiveWhysDrill />}
      {drillType === 'jtbd' && <JtbdDrill />}
      {drillType === 'pre-mortem' && <PreMortemDrill />}
      {drillType === 'pr-faq' && <PrFaqDrill />}
    </section>
  );
}
