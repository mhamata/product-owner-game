'use client';

import { useEffect, useState } from 'react';

interface ProgressRingProps {
  /** 0..1 fill fraction. */
  value: number;
  /** Outer pixel size. */
  size: number;
  strokeWidth: number;
  /** Tailwind text-* color class for the filled arc (default accent). */
  colorClass?: string;
  /** Animate the fill in on mount (honors prefers-reduced-motion via CSS). */
  animate?: boolean;
  className?: string;
}

/**
 * Precise SVG mastery ring, matching the mockup's `.ring` / `.miniring`.
 * Rotated -90deg so the arc starts at 12 o'clock. The fill animates from 0 on
 * mount when `animate` is set; the easing/duration are gated by the global
 * prefers-reduced-motion rule in globals.css.
 */
export function ProgressRing({
  value,
  size,
  strokeWidth,
  colorClass = 'text-accent',
  animate = false,
  className,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));

  // For the animated case, start empty then fill on the next frame so the CSS
  // transition runs. For the static case we render `clamped` directly with no
  // state at all (avoids a setState-in-effect cascade).
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (!animate) return;
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  const shown = !animate || filled ? clamped : 0;
  const offset = circumference * (1 - shown);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={{ transform: 'rotate(-90deg)' }}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        className="text-line"
        stroke="currentColor"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={colorClass}
        stroke="currentColor"
        style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)' }}
      />
    </svg>
  );
}
