// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StandupView } from '../StandupView';
import { useLearnStore } from '@/store/learnStore';
import { useReviewStore } from '@/store/reviewStore';
import { useSimEvidenceStore } from '@/store/simEvidenceStore';
import { useStandupStore } from '@/store/standupStore';
import { useGameStore } from '@/store/gameStore';
import { useIndustryStore } from '@/store/industryStore';

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
 * Render coverage for the Standup screen's self-study ungate (2026-07-16,
 * Mike): Workload (Act 2) and Standup (Act 3) must render their real,
 * actionable content from a cold start — no lock icon/copy — even though
 * Warm-up (Act 1) is not yet complete. StandupView reads FOUR persisted
 * stores gated on their own `hasHydrated` flag; rather than race real
 * localStorage rehydration timing, every one is force-hydrated here via
 * `setState` so the test is deterministic.
 */
describe('StandupView (self-study open access)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useLearnStore.getState().resetProgress();
    useLearnStore.setState({ hasHydrated: true });
    useReviewStore.setState({ schedules: {}, hasHydrated: true });
    useSimEvidenceStore.setState({ scores: {}, hasHydrated: true });
    useStandupStore.getState().resetToday();
    useStandupStore.setState({ hasHydrated: true });
    useGameStore.setState({ state: null, scenarioId: null });
    useIndustryStore.setState({ hasHydrated: true });
  });

  it('renders Workload and Standup as fully actionable from a cold start, before Warm-up is complete', () => {
    render(<StandupView />);

    // No lock icon/copy anywhere — the acts are open, not gated.
    expect(screen.queryByText(/Finish the warm-up to unlock/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Finish today.s block first/i)).not.toBeInTheDocument();

    // Act 2 (Workload) shows its real "chosen by your scheduler" card, not a
    // dimmed locked placeholder.
    expect(screen.getByText('Chosen by your scheduler')).toBeInTheDocument();

    // Act 3 (Standup) shows a real, clickable CTA — either the cold-start
    // "Start your first run" (title + button both say it) or the mid-flight
    // "Open your standup" variant.
    const standupCtas = [
      ...screen.queryAllByText('Start your first run'),
      ...screen.queryAllByText('Open your standup'),
    ];
    expect(standupCtas.length).toBeGreaterThan(0);
  });
});
