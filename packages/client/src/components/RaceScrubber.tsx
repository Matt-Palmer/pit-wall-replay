import { formatRaceTime } from '../lib/helpers';

type RaceScrubberProps = {
  timeMs: number;
  onTimeChange: (timeMs: number) => void;
  leaderLapStarts: number;
  leaderLap: number;
  start: number;
  end: number;
};

export function RaceScrubber({ timeMs, onTimeChange, leaderLapStarts, leaderLap, start, end }: RaceScrubberProps) {
  return (
    <>
    <label htmlFor="race-time">{formatRaceTime(timeMs)} Lap {leaderLap}/{leaderLapStarts}</label>
    <input id="race-time" type="range" min={0} max={end - start} step={1000} value={timeMs} onChange={e => onTimeChange(Number(e.target.value))} aria-label="Race Time" />
    </>
  );
}