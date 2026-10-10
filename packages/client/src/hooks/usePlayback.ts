import { useCallback, useEffect, useRef, useState } from 'react';
import {
  advance,
  effectiveRate,
  endHold,
  initialPlayback,
  nextLapTime,
  prevLapTime,
  startHold,
  toggleSpeed,
  type Hold,
  type PlaybackState,
  type Speed,
} from '../lib/playback';

// Caps how far one frame can move time, e.g. after the main thread was blocked
const MAX_FRAME_MS = 100;

type UsePlaybackOptions = {
  leaderLapStarts: number[];
  start: number;
  end: number;
  // True while the scrubber is being dragged; time holds still and carries on from the drop point
  suspended: boolean;
};

export function usePlayback({ leaderLapStarts, start, end, suspended }: UsePlaybackOptions) {
  const [timeMs, setTimeMs] = useState(0);
  const [state, setState] = useState<PlaybackState>(initialPlayback);
  // Mirrors timeMs so the frame loop can read it without restarting on every frame
  const timeRef = useRef(0);
  const durationMs = Math.max(end - start, 0);
  const rate = effectiveRate(state);

  const seek = useCallback((ms: number) => {
    timeRef.current = ms;
    setTimeMs(ms);
  }, []);

  useEffect(() => {
    if (rate === 0 || suspended) return;

    let frame: number;
    let last: number | undefined;
    const tick = (now: number) => {
      const dt = last === undefined ? 0 : Math.min(now - last, MAX_FRAME_MS);
      last = now;

      const { timeMs: next, atBound } = advance(timeRef.current, rate, dt, durationMs);
      seek(next);
      if (atBound) setState((s) => ({ ...s, playing: false }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rate, suspended, durationMs, seek]);

  const togglePlay = useCallback(() => {
    setState((s) => ({ ...s, playing: !s.playing }));
  }, []);
  const setSpeed = useCallback((speed: Exclude<Speed, 1>) => setState((s) => toggleSpeed(s, speed)), []);
  const hold = useCallback((h: Hold) => setState((s) => startHold(s, h)), []);
  const release = useCallback(() => setState(endHold), []);
  const nextLap = useCallback(() => seek(nextLapTime(leaderLapStarts, start, end, timeRef.current)), [leaderLapStarts, start, end, seek]);
  const prevLap = useCallback(() => seek(prevLapTime(leaderLapStarts, start, timeRef.current)), [leaderLapStarts, start, seek]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      // Space on a focused button already clicks it
      if (e.key === ' ' && e.target instanceof HTMLButtonElement) return;

      const actions: Record<string, () => void> = {
        ' ': togglePlay,
        '.': () => hold('forward'),
        ',': () => hold('rewind'),
        ']': nextLap,
        '[': prevLap,
        '2': () => setSpeed(2),
        '5': () => setSpeed(5),
        '0': () => setSpeed(10),
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === '.' || e.key === ',') release();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // A key released while the window is unfocused never fires keyup, so let go on blur
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', release);
    };
  }, [togglePlay, hold, release, nextLap, prevLap, setSpeed]);

  return {
    timeMs,
    durationMs,
    state,
    seek,
    togglePlay,
    setSpeed,
    hold,
    release,
    nextLap,
    prevLap,
  };
}

export type Playback = ReturnType<typeof usePlayback>;

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && target.type !== 'range';
}
