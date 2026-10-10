import { leaderLapAt } from './timeline';

export type Speed = 1 | 2 | 5 | 10;
export type Hold = 'forward' | 'rewind';

export type PlaybackState = {
  playing: boolean;
  speed: Speed;
  // Set while fast forward or rewind is held down; overrides playing and speed until released
  hold: Hold | null;
};

export const initialPlayback: PlaybackState = { playing: false, speed: 1, hold: null };

const HOLD_RATE = 2;
// Pressing previous lap within this long of a lap's start goes to the lap before instead
export const PREV_LAP_GRACE_MS = 3000;

// How many ms of race time pass per ms of real time
export function effectiveRate(state: PlaybackState): number {
  if (state.hold) return state.hold === 'forward' ? HOLD_RATE : -HOLD_RATE;
  return state.playing ? state.speed : 0;
}

// Pressing the active speed returns to 1x. Speed never starts or stops playback.
export function toggleSpeed(state: PlaybackState, speed: Exclude<Speed, 1>): PlaybackState {
  return { ...state, speed: state.speed === speed ? 1 : speed, hold: null };
}

// Fast forward and rewind are only available at 1x
export function startHold(state: PlaybackState, hold: Hold): PlaybackState {
  if (state.speed !== 1) return state;
  return { ...state, hold };
}

export function endHold(state: PlaybackState): PlaybackState {
  return state.hold ? { ...state, hold: null } : state;
}

// Moves race time on by dtMs of real time, stopping at either end of the race
export function advance(timeMs: number, rate: number, dtMs: number, durationMs: number): { timeMs: number; atBound: boolean } {
  const next = timeMs + rate * dtMs;
  if (rate < 0 && next <= 0) return { timeMs: 0, atBound: true };
  if (rate > 0 && next >= durationMs) return { timeMs: durationMs, atBound: true };
  return { timeMs: next, atBound: false };
}

// Race time of the start of the leader's next lap, or the end of the race if they are on the last lap
export function nextLapTime(leaderLapStarts: number[], start: number, end: number, timeMs: number): number {
  const lapsStarted = leaderLapAt(leaderLapStarts, start + timeMs);
  const next = leaderLapStarts[lapsStarted];
  return next === undefined ? end - start : next - start;
}

// Race time of the start of the leader's current lap, or the lap before if already near its start
export function prevLapTime(leaderLapStarts: number[], start: number, timeMs: number): number {
  const current = leaderLapAt(leaderLapStarts, start + timeMs) - 1;
  if (current < 0) return 0;

  const currentStart = leaderLapStarts[current]! - start;
  if (timeMs - currentStart > PREV_LAP_GRACE_MS) return Math.max(currentStart, 0);

  const previous = leaderLapStarts[current - 1];
  return previous === undefined ? 0 : Math.max(previous - start, 0);
}
