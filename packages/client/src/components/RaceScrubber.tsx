import { useState } from 'react';
import { formatRaceTime } from '../lib/helpers';
import { leaderLapAt } from '../lib/timeline';
import type { Hold, PlaybackState, Speed } from '../lib/playback';

import '../styles/raceScrubber.css';

const STEP_MS = 1000;
const SPEEDS: Exclude<Speed, 1>[] = [2, 5, 10];

type RaceScrubberProps = {
  timeMs: number;
  onTimeChange: (timeMs: number) => void;
  // Reports the time live while dragging, then null once it is committed
  onScrub?: (timeMs: number | null) => void;
  leaderLapStarts: number[];
  start: number;
  end: number;
  playback: PlaybackState;
  onTogglePlay: () => void;
  onSpeed: (speed: Exclude<Speed, 1>) => void;
  onHold: (hold: Hold) => void;
  onRelease: () => void;
  onNextLap: () => void;
  onPrevLap: () => void;
};

export function RaceScrubber({
  timeMs,
  onTimeChange,
  onScrub,
  leaderLapStarts,
  start,
  end,
  playback,
  onTogglePlay,
  onSpeed,
  onHold,
  onRelease,
  onNextLap,
  onPrevLap,
}: RaceScrubberProps) {
  // Local value while the user is dragging; null means "follow the parent's timeMs".
  const [draftMs, setDraftMs] = useState<number | null>(null);
  const displayMs = draftMs ?? timeMs;
  // Derived from the draft time so the lap updates live while dragging
  const leaderLap = leaderLapAt(leaderLapStarts, start + displayMs);
  const durationMs = end - start;
  // Fast forward and rewind only apply at 1x
  const holdDisabled = playback.speed !== 1;

  const commit = () => {
    if (draftMs === null) return;
    onTimeChange(draftMs);
    setDraftMs(null);
    onScrub?.(null);
  };

  // Held with the pointer; capture keeps the release coming here even if the pointer slides off
  const holdProps = (hold: Hold) => ({
    disabled: holdDisabled,
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      onHold(hold);
    },
    onPointerUp: onRelease,
    onPointerCancel: onRelease,
    onLostPointerCapture: onRelease,
  });

  return (
    <div className="race-scrubber">
      <input
        id="race-time"
        className="race-scrubber__input"
        type="range"
        min={0}
        // Rounded up to a whole step, as the slider can only land on steps and must be able to reach the end
        max={Math.ceil(durationMs / STEP_MS) * STEP_MS}
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

      <div className="race-scrubber__controls">
        <label className="race-scrubber__label" htmlFor="race-time">
          {formatRaceTime(displayMs)} Lap {leaderLap}/{leaderLapStarts.length}
        </label>

        <div className="race-scrubber__transport">
          <button type="button" onClick={onPrevLap} disabled={displayMs <= 0} aria-label="Previous lap" title="Previous lap ([)">−1</button>
          <button type="button" {...holdProps('rewind')} aria-label="Rewind" title="Rewind (hold ,)">&lt;</button>
          <button
            type="button"
            className="race-scrubber__play"
            onClick={onTogglePlay}
            aria-label={playback.playing ? 'Pause' : 'Play'}
            title={playback.playing ? 'Pause (Space)' : 'Play (Space)'}
          >
            {playback.playing ? '❚❚' : '▶'}
          </button>
          <button type="button" {...holdProps('forward')} aria-label="Fast forward" title="Fast forward (hold .)">&gt;</button>
          <button type="button" onClick={onNextLap} disabled={displayMs >= durationMs} aria-label="Next lap" title="Next lap (])">+1</button>
        </div>

        <div className="race-scrubber__speeds" role="group" aria-label="Playback speed">
          {SPEEDS.map(speed => (
            <button
              key={speed}
              type="button"
              aria-pressed={playback.speed === speed}
              onClick={() => onSpeed(speed)}
              title={`${speed}x speed (${speed === 10 ? 0 : speed})`}
            >
              x{speed}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
