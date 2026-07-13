import { describe, it, expect } from 'vitest';
import { deriveProvenance } from '../reviewProvenance';
import { pickRefreshIndustry } from '../skillRefresh';

describe('deriveProvenance', () => {
  it('renders a normally-due card in the learner\'s home industry, no chips', () => {
    const p = deriveProvenance(false, 'saas');
    expect(p).toEqual({
      fromRun: false,
      renderedIndustry: 'saas',
      homeIndustry: 'saas',
      showSkinChip: false,
    });
  });

  it('renders a never-resurfaced (undefined flag) card the same as false', () => {
    const p = deriveProvenance(undefined, 'fintech');
    expect(p.fromRun).toBe(false);
    expect(p.renderedIndustry).toBe('fintech');
    expect(p.showSkinChip).toBe(false);
  });

  it('renders a resurfaced card in the next industry in the cyclic rotation, with both chips due', () => {
    const p = deriveProvenance(true, 'saas');
    expect(p.fromRun).toBe(true);
    expect(p.renderedIndustry).toBe(pickRefreshIndustry('saas'));
    expect(p.renderedIndustry).not.toBe('saas');
    expect(p.showSkinChip).toBe(true);
  });

  it('is deterministic for the same inputs (no randomness)', () => {
    const a = deriveProvenance(true, 'healthcare');
    const b = deriveProvenance(true, 'healthcare');
    expect(a).toEqual(b);
  });
});
