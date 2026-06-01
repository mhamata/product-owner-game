import type { Scenario } from '@/engine/types';
import { scenario01 } from './scenario01';

// scenario02 ('02-clearing-pipeline') is intentionally NOT imported or exported
// here: it is 100% finance/Moomoo content and is excluded from the app until it
// is de-specialized. Leaving it out of this map is what makes its
// /play/02-clearing-pipeline route 404. The file is kept in place — see the
// header comment in ./scenario02.ts. Do not re-add it without genericizing it.

export const scenarios: Record<string, Scenario> = {
  [scenario01.id]: scenario01,
};

export function getScenario(id: string): Scenario | null {
  return scenarios[id] ?? null;
}

export { scenario01 };
