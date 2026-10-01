import { useState } from 'react';
import { formatRaceTime } from '../lib/helpers';
import { leaderLapAt } from '../lib/timeline';

import '../styles/raceScrubber.css';

const STEP_MS = 1000;

type RaceScrubberProps = {
  timeMs: number;
  onTimeChange: (timeMs: number) => void;
  // Reports the time live while dragging, then null once it is committed
  onScrub?: (timeMs: number | null) => void;
  leaderLapStarts: number[];
  start: number;
  end: number;
};

export function RaceScrubber({ timeMs, onTimeChange, onScrub, leaderLapStarts, start, end }: RaceScrubberProps) {
  // Local value while the user is dragging; null means "follow the parent's timeMs".
  const [draftMs, setDraftMs] = useState<number | null>(null);
  const displayMs = draftMs ?? timeMs;
  // Derived from the draft time so the lap updates live while dragging
  const leaderLap = leaderLapAt(leaderLapStarts, start + displayMs);

  const commit = () => {
    if (draftMs === null) return;
    onTimeChange(draftMs);
    setDraftMs(null);
    onScrub?.(null);
  };

  return (
    <>
      <label htmlFor="race-time">{formatRaceTime(displayMs)} Lap {leaderLap}/{leaderLapStarts.length}</label>
      <input
        id="race-time"
        className="race-scrubber__input"
        type="range"
        min={0}
        // Rounded up to a whole step, as the slider can only land on steps and must be able to reach the end
        max={Math.ceil((end - start) / STEP_MS) * STEP_MS}
        step={STEP_MS}
        value={displayMs}
        onChange={e => {
          const ms = Number(e.target.value);
          setDraftMs(ms);
          onScrub?.(ms);
        }}
        onPointerDown={e => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        aria-label="Race Time"
      />
    </>
  );
}
