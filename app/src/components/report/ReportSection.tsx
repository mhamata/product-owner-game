import Link from 'next/link';
import { ArrowRightIcon } from '@/components/console/Icon';

/**
 * SECTION SHELL: a titled report section with a count chip, or a per-section
 * empty state. Extracted from `ReadinessReport.tsx` so the Career File section
 * (a second, independent data source — the decision log, not the graded
 * interview/artifact history) can reuse the exact same shell without a
 * circular import between the two files.
 */
export function ReportSection({
  title,
  icon,
  count,
  emptyLabel,
  emptyHref,
  emptyCta,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  emptyLabel: string;
  emptyHref: string;
  emptyCta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-11 break-inside-avoid print:mt-8">
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-line pb-3">
        <span className="mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-console-sm border border-line bg-panel-2 px-[10px] py-1 text-[11px] uppercase tracking-[0.14em] text-mute print:bg-transparent">
          {icon}
          {title}
        </span>
        <span className="mono ml-auto whitespace-nowrap text-[12px] text-faint tnum">
          {padIndex(count)} attached
        </span>
      </div>

      {count === 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-console-lg border border-dashed border-line bg-panel p-[14px_16px] print:bg-transparent">
          <span className="text-[13px] text-slate">{emptyLabel}</span>
          <Link
            href={emptyHref}
            className="mono ml-auto inline-flex items-center gap-1.5 rounded-console border border-line bg-paper px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink print:hidden"
          >
            {emptyCta}
            <ArrowRightIcon size={13} />
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4">{children}</div>
      )}
    </section>
  );
}

const padIndex = (n: number) => String(n).padStart(2, '0');
