// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PracticeMap } from '../PracticeMap';
import { useLearnStore } from '@/store/learnStore';
import { useIndustryStore } from '@/store/industryStore';
import { levels, tracks } from '@/curriculum/data';
import { SIM_LADDER } from '@/scenarios/ladder';

// jsdom doesn't implement matchMedia; stubbed defensively like
// SimTabs.test.tsx does, in case anything nested reaches for it.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/**
 * Render coverage for the Practice Map's self-study ungate (2026-07-16,
 * Mike): before this slice there was no render test at all for this screen's
 * lock/collapse treatment (see the ungate scout report, section 9). Every
 * level, every sim rung, and the specialization-tracks section must render
 * fully open from a cold start — no lock icon/copy anywhere — and the
 * certify CTA is available for any not-yet-certified level with a buildable
 * placement challenge.
 */
describe('PracticeMap (self-study open access)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useLearnStore.getState().resetProgress();
    useIndustryStore.setState({ industry: useIndustryStore.getState().industry, hasHydrated: true });
  });

  it('renders every level fully expanded from a cold start, with zero lock copy anywhere', () => {
    render(<PracticeMap />);

    for (const level of levels) {
      // Each level's header label renders — proving the section is not
      // collapsed into a locknote.
      expect(screen.getAllByText(level.label).length).toBeGreaterThan(0);
    }

    // No lock icon/copy survives the ungate, on any level.
    expect(screen.queryByText(/^Locked$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reach the active skill first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Unlocks as you master/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/to unlock/i)).not.toBeInTheDocument();
  });

  it('shows a "Certify this level" CTA for a not-yet-certified level with a buildable challenge', () => {
    render(<PracticeMap />);
    // Foundations has an authored placement challenge (see placement.test.ts)
    // and is uncertified from a cold start, so its CTA must render.
    expect(screen.getAllByText('Certify this level').length).toBeGreaterThan(0);
  });

  it('renders every sim ladder rung as a live, playable link — never a disabled card', () => {
    render(<PracticeMap />);
    for (const rung of SIM_LADDER) {
      const titleEl = screen.getByText(rung.title);
      expect(titleEl.closest('a')).toHaveAttribute('href', `/play/${rung.scenarioId}`);
    }
  });

  it('always shows the specialization tracks section, fully open, with no certify-to-unlock gate', () => {
    render(<PracticeMap />);
    expect(screen.getByText('Specializations')).toBeInTheDocument();
    for (const track of tracks) {
      // getAllByText, not getByText: a couple of track labels (e.g.
      // "Marketplace") collide with an unrelated <option> in the home-
      // industry picker — this only needs the track card itself to be
      // present, not text-uniqueness across the whole page.
      expect(screen.getAllByText(track.label).length).toBeGreaterThan(0);
    }
    // Each track's skills are live links, not a dashed locked card.
    for (const track of tracks) {
      const skillLink = screen.getByText(track.skills[0].title);
      expect(skillLink.closest('a')).toHaveAttribute('href', `/learn/${track.skills[0].id}`);
    }
  });
});
