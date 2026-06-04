import type { ComponentType } from 'react';
import type { Modality } from '@/curriculum/types';
import { MODALITIES } from '@/curriculum/types';
import {
  RocketIcon,
  FlaskIcon,
  FileIcon,
  BookIcon,
  MessageIcon,
  ScaleIcon,
  LightbulbIcon,
} from './Icon';

type IconCmp = ComponentType<{ size?: number; className?: string }>;

/**
 * One small icon per practice modality, reused by the skill cards and the
 * coming-soon lesson. Icons are decorative — every place that renders them
 * also exposes the modality label (tooltip / sr text), never icon-alone.
 */
const MODALITY_ICON: Record<Modality, IconCmp> = {
  lesson: LightbulbIcon,
  drill: FlaskIcon,
  artifact: FileIcon,
  sim: RocketIcon,
  roleplay: MessageIcon,
  judgment: ScaleIcon,
  reading: BookIcon,
  reference: BookIcon,
};

/**
 * Render a skill's modalities as a tidy row of labelled icons. `live`
 * modalities (drill/sim) read in accent; planned ones in the muted tone so the
 * card telegraphs what's playable today at a glance.
 */
export function ModalityIcons({
  modalities,
  className = '',
}: {
  modalities: Modality[];
  className?: string;
}) {
  if (modalities.length === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {modalities.map((m) => {
        const Icon = MODALITY_ICON[m];
        const meta = MODALITIES[m];
        return (
          <span
            key={m}
            title={`${meta.label}${meta.live ? '' : ' · coming soon'}`}
            className={meta.live ? 'text-accent' : 'text-faint'}
          >
            <Icon size={13} />
            <span className="sr-only">{meta.label}</span>
          </span>
        );
      })}
    </span>
  );
}
