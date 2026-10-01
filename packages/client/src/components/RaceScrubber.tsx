import { useState } from 'react';
import { formatRaceTime } from '../lib/helpers';

const STEP_MS = 1000;

type RaceScrubberProps = {
  timeMs: number;
  onTimeChange: (timeMs: number) => void;
  leaderLapStarts: number;
  leaderLap: number;
  start: number;
  end: number;
};

export function RaceScrubber({ timeMs, onTimeChange, leaderLapStarts, leaderLap, start, end }: RaceScrubberProps) {
  // Local value while the user is dragging; null means "follow the parent's timeMs".
  const [draftMs, setDraftMs] = useState<number | null>(null);
  const displayMs = draftMs ?? timeMs;

  const commit = () => {
    if (draftMs === null) return;
    onTimeChange(draftMs);
    setDraftMs(null);
  };

  return (
    <>
      <label htmlFor="race-time">{formatRaceTime(displayMs)} Lap {leaderLap}/{leaderLapStarts}</label>
      <input
        id="race-time"
        type="range"
        min={0}
        // Rounded up to a whole step, as the slider can only land on steps and must be able to reach the end
        max={Math.ceil((end - start) / STEP_MS) * STEP_MS}
        step={STEP_MS}
        value={displayMs}
        onChange={e => setDraftMs(Number(e.target.value))}
        onPointerDown={e => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        aria-label="Race Time"
      />
    </>
  );
}
