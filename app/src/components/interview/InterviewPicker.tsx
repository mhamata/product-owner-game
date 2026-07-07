import Link from 'next/link';
import { ALL_INTERVIEW_CASES, type InterviewCase, type InterviewKind } from '@/curriculum/interview';
import { Topbar } from '@/components/console/Topbar';
import { ArrowRightIcon, ClockIcon, FlaskIcon, LightbulbIcon, UsersIcon } from '@/components/console/Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * The mock-interview case picker: one card per authored case, in the registry's
 * order. A card shows the title, a kind chip (product-sense / execution), the
 * hook, the interviewer, and the rough duration — everything a candidate needs to
 * choose a screen to sit, and nothing from the hidden `brief`.
 *
 * A server component: it renders static case metadata and links, with no client
 * state, so it stays out of the JS bundle. The session route is where the live,
 * client-side interview loop lives.
 */

/** Per-kind chip styling + label + icon, paired colour-plus-word (never hue alone). */
const KIND_META: Record<
  InterviewKind,
  { label: string; cls: string; icon: typeof LightbulbIcon }
> = {
  'product-sense': {
    label: 'Product sense',
    cls: 'border-accent-100 bg-accent-050 text-accent',
    icon: LightbulbIcon,
  },
  execution: {
    label: 'Execution',
    cls: 'border-good-line bg-good-050 text-good',
    icon: FlaskIcon,
  },
};

export function InterviewPicker() {
  return (
    <>
      <Topbar />

      <main className="flex-auto">
        <div className="mx-auto max-w-[1080px] px-6 pb-24">
          {/* page header */}
          <header className="border-b-2 border-line pb-6 pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                <UsersIcon size={12} />
                Mock interview
              </span>
              <span className="mono rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate">
                {padIndex(ALL_INTERVIEW_CASES.length)} cases
              </span>
            </div>
            <h1 className="mt-4 text-[28px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink max-[560px]:text-[23px]">
              Sit a mock PM interview
            </h1>
            <p className="mt-2 max-w-[640px] text-[14px] leading-[1.65] text-slate">
              An AI interviewer runs a real screen: it probes with follow-ups, reveals case data
              only when you ask the right questions, and withholds approval the way a real
              interviewer does. Afterwards a hiring committee scores the whole transcript.
            </p>
          </header>

          {/* the case grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ALL_INTERVIEW_CASES.map((interviewCase) => (
              <CaseCard key={interviewCase.id} interviewCase={interviewCase} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

/** One case card, linking to its session route. */
function CaseCard({ interviewCase }: { interviewCase: InterviewCase }) {
  const kind = KIND_META[interviewCase.kind];
  const KindIcon = kind.icon;

  return (
    <Link
      href={`/interview/${interviewCase.id}`}
      className="group flex flex-col rounded-console-lg border border-line bg-paper p-[19px_21px] no-underline shadow-console-sm transition-[border-color,box-shadow,transform] duration-150 hover:border-faint hover:shadow-console-md active:translate-y-px"
    >
      <div className="flex items-center gap-2">
        <span
          className={`mono inline-flex items-center gap-1.5 rounded-console-sm border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${kind.cls}`}
        >
          <KindIcon size={12} />
          {kind.label}
        </span>
        <span className="mono ml-auto inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.08em] text-faint">
          <ClockIcon size={12} />
          {interviewCase.durationMin} min
        </span>
      </div>

      <h2 className="mt-3 text-[18px] font-bold leading-[1.25] tracking-[-0.01em] text-ink">
        {interviewCase.title}
      </h2>
      <p className="mt-2 flex-auto text-[13.5px] leading-[1.6] text-slate">
        {interviewCase.hook}
      </p>

      <div className="mt-4 flex items-center gap-2 border-t border-dashed border-line pt-3">
        <span className="inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border border-line bg-panel text-slate">
          <UsersIcon size={14} />
        </span>
        <span className="text-[12.5px] text-ink-2">
          <span className="font-semibold text-ink">{interviewCase.interviewerName}</span>
          <span className="text-mute"> · your interviewer</span>
        </span>
        <span className="mono ml-auto inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent transition-transform duration-150 group-hover:translate-x-0.5">
          Start
          <ArrowRightIcon size={14} />
        </span>
      </div>
    </Link>
  );
}
