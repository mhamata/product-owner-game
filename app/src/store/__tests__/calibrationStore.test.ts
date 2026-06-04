import { describe, it, expect, beforeEach } from 'vitest';
import { useCalibrationStore } from '../calibrationStore';

describe('calibrationStore', () => {
  beforeEach(() => useCalibrationStore.getState().reset());

  it('records a correct call as a hit and reports full accuracy', () => {
    const s = useCalibrationStore.getState();
    s.predict(1, true);
    expect(useCalibrationStore.getState().pending).toEqual({ iteration: 1, allShip: true });
    useCalibrationStore.getState().resolve(true);
    const after = useCalibrationStore.getState();
    expect(after.predictions).toBe(1);
    expect(after.hits).toBe(1);
    expect(after.pending).toBeNull();
    expect(after.accuracy()).toBe(100);
  });

  it('counts a wrong call as a miss and averages accuracy over calls', () => {
    const s = useCalibrationStore.getState();
    s.predict(1, true);
    s.resolve(false); // predicted all-ship, but some slipped: miss
    s.predict(2, false);
    s.resolve(false); // predicted some-slip, and some slipped: hit
    const after = useCalibrationStore.getState();
    expect(after.predictions).toBe(2);
    expect(after.hits).toBe(1);
    expect(after.accuracy()).toBe(50);
  });

  it('treats resolve with no pending call as a no-op', () => {
    useCalibrationStore.getState().resolve(true);
    const after = useCalibrationStore.getState();
    expect(after.predictions).toBe(0);
    expect(after.accuracy()).toBeNull();
  });

  it('lets a later call overwrite an unresolved one for the same sprint', () => {
    const s = useCalibrationStore.getState();
    s.predict(1, true);
    s.predict(1, false);
    expect(useCalibrationStore.getState().pending).toEqual({ iteration: 1, allShip: false });
  });
});
