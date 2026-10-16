import { describe, expect, it } from 'vitest';
import { carPositionAt, standingAt } from "./timeline";
import type { DriverStreams, SessionTimeline } from '../hooks/useSessionTimeline';
import type { Stint } from "@pitwall/shared";

const lapsUpTo = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({lap_number: i + 1, t: (i + 1) * 1000})) as DriverStreams['laps'];
};

const stint = (stint_number: number, lap_start: number, lap_end: number | null) => ({ stint_number, lap_start, lap_end, compound: 'MEDIUM', tyre_age_at_start: 0 }) as Stint;

function timelineWith(streams: Partial<DriverStreams>): SessionTimeline {
  return {
    byDriver: new Map([
      [1, { positions: [], intervals: [], laps: [], stints: [], ...streams }],
    ]),
    start: 0,
    end: 0,
    leaderLapStarts: [],
    stoppedAt: new Map(),
  };
}

const car = {
  t: [1000, 2000, 10000],
  x: [0, 100, 500],
  y: [0, -50, 500],
};

describe('carPositionAt', () => {
  it('returns the sample exactly at t', () => {
    expect(carPositionAt(car, 2000)).toEqual({ x: 100, y: -50 });
  });

  it('interpolates between samples', () => {
    expect(carPositionAt(car, 1500)).toEqual({ x: 50, y: -25 });
  });

  it('holds the last point across a gap of more than 5 s', () => {
    expect(carPositionAt(car, 6000)).toEqual({ x: 100, y: -50 });
  });

  it('places the car at its first sample before it starts', () => {
    expect(carPositionAt(car, 0)).toEqual({ x: 0, y: 0 });
  });

  it('holds the last sample after the data ends', () => {
    expect(carPositionAt(car, 20000)).toEqual({ x: 500, y: 500 });
  });

  it('hides the car more than 30 s into a gap in the data', () => {
    const gappy = { t: [1000, 2000, 100_000], x: [0, 100, 500], y: [0, -50, 500] };
    expect(carPositionAt(gappy, 32_000)).toEqual({ x: 100, y: -50 });
    expect(carPositionAt(gappy, 32_001)).toBeUndefined();
    expect(carPositionAt(gappy, 100_000)).toEqual({ x: 500, y: 500 });
  });

  it('hides the car more than 30 s after the data ends', () => {
    expect(carPositionAt(car, 40_001)).toBeUndefined();
  });

  it('hides the car once it has stopped running', () => {
    expect(carPositionAt(car, 1999, 2000)).toBeDefined();
    expect(carPositionAt(car, 2000, 2000)).toBeUndefined();
  });

  it('returns undefined for a car with no samples', () => {
    expect(carPositionAt({ t: [], x: [], y: [] }, 1000)).toBeUndefined();
  });
});

describe("standingAt stops", () => {
  const timeline = timelineWith({
		laps: lapsUpTo(50),
		stints: [stint(1, 1, 20), stint(2, 21, 50)],
	});

	it("should correctly indicate when a driver has stopped 0 times", () => {
		const standing = standingAt(timeline, new Map(), 10_500);
		expect(standing[0]?.stops).toBe(0);
	});

	it("should correctly indicate when a driver has stopped 1 time", () => {
		const standing = standingAt(timeline, new Map(), 30_500);
		expect(standing[0]?.stops).toBe(1);
	});

  it("counts the current stint when it has no end lap yet", () => {
		const liveTimeline = timelineWith({
			laps: lapsUpTo(50),
			stints: [stint(1, 1, 20), stint(2, 21, null)],
		});

		const standing = standingAt(liveTimeline, new Map(), 30_500);
		expect(standing[0]?.stops).toBe(1);
	});
});