import { describe, expect, it } from 'vitest';
import { advance, effectiveRate, endHold, initialPlayback, nextLapTime, prevLapTime, startHold, toggleSpeed } from './playback';

describe('effectiveRate', () => {
  it('is zero while paused', () => {
    expect(effectiveRate(initialPlayback)).toBe(0);
  });

  it('is the speed while playing', () => {
    expect(effectiveRate({ playing: true, speed: 5, hold: null })).toBe(5);
  });

  it('is fixed at 2x forward or back while held, even when paused', () => {
    expect(effectiveRate({ playing: false, speed: 1, hold: 'forward' })).toBe(2);
    expect(effectiveRate({ playing: true, speed: 1, hold: 'rewind' })).toBe(-2);
  });
});

describe('toggleSpeed', () => {
  it('sets the speed without starting playback', () => {
    expect(toggleSpeed(initialPlayback, 5)).toEqual({ playing: false, speed: 5, hold: null });
  });

  it('switches straight from one speed to another', () => {
    expect(toggleSpeed({ playing: true, speed: 2, hold: null }, 10).speed).toBe(10);
  });

  it('returns to 1x when the active speed is pressed again', () => {
    expect(toggleSpeed({ playing: true, speed: 2, hold: null }, 2)).toEqual({ playing: true, speed: 1, hold: null });
  });
});

describe('startHold / endHold', () => {
  it('returns to the previous state on release', () => {
    const paused = initialPlayback;
    expect(endHold(startHold(paused, 'rewind'))).toEqual(paused);

    const playing = { playing: true, speed: 1 as const, hold: null };
    expect(endHold(startHold(playing, 'forward'))).toEqual(playing);
  });

  it('is unavailable while a speed toggle is on', () => {
    const fast = { playing: true, speed: 5 as const, hold: null };
    expect(startHold(fast, 'forward')).toBe(fast);
  });
});

describe('advance', () => {
  it('moves time on by rate × elapsed real time', () => {
    expect(advance(1000, 5, 100, 10000)).toEqual({ timeMs: 1500, atBound: false });
    expect(advance(1000, -2, 100, 10000)).toEqual({ timeMs: 800, atBound: false });
  });

  it('stops at the start when rewinding', () => {
    expect(advance(100, -2, 100, 10000)).toEqual({ timeMs: 0, atBound: true });
  });

  it('stops at the end when playing', () => {
    expect(advance(9900, 2, 100, 10000)).toEqual({ timeMs: 10000, atBound: true });
  });
});

// Leader laps start at 0 s, 90 s and 180 s into the race; the race ends at 270 s
const start = 1_000_000;
const end = start + 270_000;
const lapStarts = [start, start + 90_000, start + 180_000];

describe('nextLapTime', () => {
  it('jumps to the start of the next lap', () => {
    expect(nextLapTime(lapStarts, start, end, 30_000)).toBe(90_000);
  });

  it('jumps from exactly a lap start to the following lap', () => {
    expect(nextLapTime(lapStarts, start, end, 90_000)).toBe(180_000);
  });

  it('jumps to the end of the race from the last lap', () => {
    expect(nextLapTime(lapStarts, start, end, 200_000)).toBe(270_000);
  });

  it('jumps to lap 1 from before it starts', () => {
    expect(nextLapTime([start + 5000], start, end, 0)).toBe(5000);
  });
});

describe('prevLapTime', () => {
  it('jumps to the start of the current lap', () => {
    expect(prevLapTime(lapStarts, start, 120_000)).toBe(90_000);
  });

  it('jumps to the previous lap when within 3 s of the current lap start', () => {
    expect(prevLapTime(lapStarts, start, 92_000)).toBe(0);
    expect(prevLapTime(lapStarts, start, 180_000)).toBe(90_000);
  });

  it('jumps to the current lap start just outside the grace window', () => {
    expect(prevLapTime(lapStarts, start, 93_001)).toBe(90_000);
  });

  it('jumps to the start of the race from lap 1', () => {
    expect(prevLapTime(lapStarts, start, 1000)).toBe(0);
    expect(prevLapTime(lapStarts, start, 60_000)).toBe(0);
  });

  it('jumps to the start of the race from before lap 1 starts', () => {
    expect(prevLapTime([start + 5000], start, 2000)).toBe(0);
  });
});
