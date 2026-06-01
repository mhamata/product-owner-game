// The five scoreboard dimensions, in plain language, mapped to the engine's
// GameScore (engine/score.ts). The mockup labels `productIntegrity` as
// "Product Quality"; we keep that learner-facing wording. Icons come from the
// shared Console icon set. Values are always read live from calculateScore — we
// never store or recompute a score here.

import type { ComponentType } from 'react';
import type { SVGProps } from 'react';
import type { GameScore } from '@/engine/score';
import {
  HeartIcon,
  ShieldIcon,
  SparkleIcon,
  TrendingUpIcon,
  UsersIcon,
} from '../Icon';

export type DimensionKey =
  | 'valueDelivered'
  | 'customerLoyalty'
  | 'teamHealth'
  | 'stakeholderTrust'
  | 'productIntegrity';

export interface DimensionMeta {
  key: DimensionKey;
  /** Two-line label as shown in the gauges, e.g. ["Value", "Delivered"]. */
  label: [string, string];
  /** Single-line label for tight spots / aria. */
  flatLabel: string;
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
}

export const DIMENSIONS: DimensionMeta[] = [
  { key: 'valueDelivered', label: ['Value', 'Delivered'], flatLabel: 'Value Delivered', Icon: TrendingUpIcon },
  { key: 'customerLoyalty', label: ['Customer', 'Loyalty'], flatLabel: 'Customer Loyalty', Icon: HeartIcon },
  { key: 'teamHealth', label: ['Team', 'Health'], flatLabel: 'Team Health', Icon: UsersIcon },
  { key: 'stakeholderTrust', label: ['Stakeholder', 'Trust'], flatLabel: 'Stakeholder Trust', Icon: ShieldIcon },
  { key: 'productIntegrity', label: ['Product', 'Quality'], flatLabel: 'Product Quality', Icon: SparkleIcon },
];

export function scoreValue(score: GameScore, key: DimensionKey): number {
  return score[key];
}
