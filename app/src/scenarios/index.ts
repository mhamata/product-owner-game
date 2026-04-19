import type { Scenario } from '@/engine/types';
import { scenario01 } from './scenario01';
import { scenario02 } from './scenario02';

export const scenarios: Record<string, Scenario> = {
  [scenario01.id]: scenario01,
  [scenario02.id]: scenario02,
};

export function getScenario(id: string): Scenario | null {
  return scenarios[id] ?? null;
}

export { scenario01, scenario02 };
