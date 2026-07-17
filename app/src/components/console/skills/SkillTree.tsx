'use client';

import { cn } from '@/lib/cn';
import type { NodeState, SkillNodeView } from '@/lib/skillTree';
import { RestartIcon } from '../Icon';

/**
 * SKILLS TAB / TECH TREE (praxis-learn-mockup.html's `#scr-skills`).
 *
 * Renders one level's skills as a connector-rail tree of node cards, styled
 * off the Sim 2.0 `--px-*` tokens (same design system the mockup and the
 * /standup + sim screens use — see globals.css's "SIM 2.0 THEME TOKENS"
 * block), so both themes come for free via `data-theme`/OS preference.
 *
 * SELF-STUDY RULING (2026-07-16): `locked` is now a CONTENT gate ONLY
 * (coming-soon — no lesson authored yet), never a progression gate. "Locked
 * ≠ hidden" still holds for that case: a locked node still renders its title
 * and unlock line, just dimmed — never blank, never a mystery box. The new
 * `open` state (ready, unmastered, not the "up next" suggestion) renders
 * full-contrast and tappable, same as `next`/`done`/`rusty`.
 */

const STATE_ACCENT: Record<NodeState, string> = {
  done: 'var(--px-good)',
  rusty: 'var(--px-warn)',
  next: 'var(--px-accent)',
  open: 'var(--px-line-strong)',
  locked: 'var(--px-line-strong)',
};

function statusLabel(node: SkillNodeView): string {
  switch (node.state) {
    case 'done':
      return `${node.strengthPct}%`;
    case 'rusty':
      return `${node.strengthPct}% · going stale`;
    case 'next':
      return 'up next';
    case 'open':
      return 'available';
    case 'locked':
      return 'coming soon';
    default:
      return '';
  }
}

function SkillNode({ node, onSelect }: { node: SkillNodeView; onSelect: () => void }) {
  const accent = STATE_ACCENT[node.state];
  const isLocked = node.state === 'locked';
  const earned = node.state === 'done' || node.state === 'rusty';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${node.skill.title}${isLocked ? ', locked' : `, ${statusLabel(node)}`}`}
      className={cn(
        'group relative flex w-full flex-col gap-1.5 rounded-[14px] border bg-[var(--px-card)] p-[13px_15px] text-left transition-[border-color,box-shadow] duration-150',
        node.state === 'next'
          ? 'border-[var(--px-accent)] shadow-[0_0_0_1px_var(--px-accent),0_4px_18px_rgba(79,179,163,0.18)]'
          : 'border-[var(--px-line)] hover:border-[var(--px-line-strong)]',
        isLocked && 'opacity-[0.58]',
      )}
    >
      {/* connector dot, sits on the rail drawn by the parent <SkillTree> */}
      <span
        aria-hidden="true"
        className="absolute top-[19px] h-2 w-2 flex-none rounded-full"
        style={{ left: '-19px', background: accent }}
      />

      <span className="flex items-baseline justify-between gap-2.5">
        <span
          className={cn(
            'text-[14px] font-semibold leading-tight tracking-[-0.005em]',
            isLocked ? 'text-[var(--px-dimmer)]' : 'text-[var(--px-ink)]',
          )}
        >
          {node.skill.title}
        </span>
        <span
          className="mono tnum flex-none text-[11px] font-bold uppercase tracking-[0.02em]"
          style={{ color: isLocked ? 'var(--px-dimmer)' : accent }}
        >
          {statusLabel(node)}
        </span>
      </span>

      <p className="text-[11px] leading-[1.5] text-[var(--px-dim)]">
        <span aria-hidden="true">{earned ? '✓ ' : ''}</span>
        {node.unlock.text}
      </p>

      {node.offersRefresh && (
        <p className="mono flex items-center gap-1.5 text-[10.5px] font-semibold" style={{ color: 'var(--px-warn)' }}>
          <RestartIcon size={11} />
          90-second refresh available
        </p>
      )}
    </button>
  );
}

export function SkillTree({
  nodes,
  onSelectSkill,
}: {
  nodes: SkillNodeView[];
  onSelectSkill: (skillId: string) => void;
}) {
  if (nodes.length === 0) return null;
  return (
    <div className="relative pl-5">
      <span
        aria-hidden="true"
        className="absolute bottom-2.5 left-[7px] top-2.5 w-[2px] bg-[var(--px-line)]"
      />
      <div className="flex flex-col gap-2.5">
        {nodes.map((node) => (
          <SkillNode key={node.skill.id} node={node} onSelect={() => onSelectSkill(node.skill.id)} />
        ))}
      </div>
    </div>
  );
}
