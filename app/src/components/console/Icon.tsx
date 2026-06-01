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
