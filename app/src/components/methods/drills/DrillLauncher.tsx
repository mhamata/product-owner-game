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
    <section className="rounded-console-lg border border-accent-100 bg-accent-050 p-5">
      <div className="mono mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-accent">
        Interactive drill
      </div>
      <h3 className="mb-3 text-[17px] font-semibold tracking-[-0.01em] text-ink">
        Practice this method
      </h3>
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
