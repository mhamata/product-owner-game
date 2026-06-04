import type { SVGProps } from 'react';

/**
 * Lightweight inline icons, traced 1:1 from the direction-b mockup so stroke
 * weights and shapes match exactly. lucide-react ^1.8 is in the tree but its
 * export surface is unstable across the 1.x line, so we inline the handful we
 * need rather than risk a build break. All are aria-hidden; callers always pair
 * them with a visible text label (never color/icon alone).
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number, props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    'aria-hidden': true as const,
    focusable: false as const,
    ...props,
  };
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function CheckIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.4}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CheckSquareIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.4}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export function LockIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.6}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function XIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function CircleDotIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, { fill: 'currentColor', ...props })}>
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

export function FlameIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg {...base(size, { fill: 'currentColor', ...props })}>
      <path d="M12 2c.5 3-1.8 4.2-2.9 5.7C7.7 9.5 7 11 7 13a5 5 0 0 0 10 .2c0-1.7-.6-3-1.4-4.2-.3 2-1.6 2.7-2.3 2.1.4-2.6-.2-5.6-1.3-9.1Z" />
    </svg>
  );
}

export function BuildingIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h0M9 13h0M9 17h0M15 9h0M15 13h0M15 17h0" />
    </svg>
  );
}

export function CaretDownIcon({ size = 11, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function StarIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M12 2l2.4 6.9H22l-6 4.3 2.3 7-6.3-4.4L5.7 20l2.3-7-6-4.3h7.6Z" />
    </svg>
  );
}

export function TriangleUpIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.4}>
      <polyline points="6 15 12 9 18 15" />
    </svg>
  );
}

export function TriangleDownIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.4}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function GridIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function InfoIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h0" />
    </svg>
  );
}

export function FlaskIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M7 14h10" />
    </svg>
  );
}

/* ------------------------------------------------------------
   Simulation icons, traced to match the sim-b.html mockup's
   inline SVGs (same stroke style as the set above). All aria-
   hidden; callers always pair with a visible text label.
   ------------------------------------------------------------ */

/** Bullseye: the persistent Mission marker. */
export function TargetIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

/** Speed gauge: capacity panel header. */
export function GaugeIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M22 12A10 10 0 1 1 12 2" />
      <path d="M12 12 19 5" />
    </svg>
  );
}

/** Line going up: Value Delivered + live forecast. */
export function TrendingUpIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  );
}

/** Heart: Customer Loyalty. */
export function HeartIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z" />
    </svg>
  );
}

/** People: Team Health. */
export function UsersIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}

/** Shield: Stakeholder Trust. */
export function ShieldIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" />
    </svg>
  );
}

/** Sparkle/gem: Product Quality. */
export function SparkleIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="m12 3 2.5 5.1 5.6.8-4 4 1 5.6L12 21l-5 2.6 1-5.6-4-4 5.6-.8Z" />
    </svg>
  );
}

/** Dollar sign: revenue readouts. */
export function DollarIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

/** Rocket: Ship a Release. */
export function RocketIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M4.5 16.5 3 21l4.5-1.5" />
      <path d="M14 4s4 0 6 2 2 6 2 6l-7 7-4-1-3-3-1-4Z" />
      <circle cx="15" cy="9" r="1.6" />
    </svg>
  );
}

/** Lightbulb: coachmark + capacity coach. */
export function LightbulbIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.2}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
    </svg>
  );
}

/** Warning triangle: telegraphed event card. */
export function AlertTriangleIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.2}>
      <path d="M12 9v4" />
      <path d="M12 17h0" />
      <path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

/** Graduation cap: "what you learned" debrief takeaway. */
export function CapIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.2}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.5" />
    </svg>
  );
}

/** Circular restart arrow: replay tutorial / restart sprint. */
export function RestartIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.2}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

/** Left chevron: Back in the action dock. */
export function ChevronLeftIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.4}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/** List/lines: committed-points forecast chip. */
export function ListIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

/** Minus: capacity penalty chip. */
export function MinusIcon({ size = 12, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.4}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/** Plus: capacity bonus chip. */
export function PlusIcon({ size = 12, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2.4}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/** Circle: capacity base chip. */
export function CircleIcon({ size = 12, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

/** Clock: "coming soon" treatment on not-yet-built skills. */
export function ClockIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}

/** Stacked layers: specialization tracks (off-ladder depth). */
export function LayersIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="M2 12l10 5 10-5" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  );
}

/** Book: reading/reference modality. */
export function BookIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17.5H6.5A2.5 2.5 0 0 0 4 22Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </svg>
  );
}

/** Speech bubble: roleplay/communication modality. */
export function MessageIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

/** Scales: judgment modality (decisions under ambiguity). */
export function ScaleIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M12 3v18M6 21h12M3 8l3-5 3 5a3 3 0 0 1-6 0Zm12 0 3-5 3 5a3 3 0 0 1-6 0Z" />
    </svg>
  );
}

/** Document/file: artifact modality (PRDs, story maps). */
export function FileIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} {...strokeProps} strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}
