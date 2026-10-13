import { describe, expect, it } from "vitest";
import type { Lap, Location } from "@pitwall/shared";
import { downsample, fastestLapTrack, hasPosition, mapWithConcurrency } from "./locations";

const BASE = Date.parse("2025-01-01T00:00:00Z");

function location(ms: number, x: number, y = 0, driver_number = 1): Location {
  return { date: new Date(BASE + ms).toISOString(), driver_number, meeting_key: 1, session_key: 1, x, y, z: 0 };
}

function lap(overrides: Partial<Lap>): Lap {
  return {
    date_start: new Date(BASE).toISOString(),
    driver_number: 1,
    duration_sector_1: null,
    duration_sector_2: null,
    duration_sector_3: null,
    i1_speed: null,
    i2_speed: null,
    is_pit_out_lap: false,
    lap_duration: 90,
    lap_number: 2,
    meeting_key: 1,
    segments_sector_1: null,
    segments_sector_2: null,
    segments_sector_3: null,
    session_key: 1,
    st_speed: null,
    ...overrides,
  };
}

describe("downsample", () => {
  it("keeps the first sample in each bucket, in time order", () => {
    const rows = [location(1500, 3), location(0, 1), location(270, 2), location(999, 9), location(1000, 4)];
    expect(downsample(rows, 1000)).toEqual({ t: [BASE, BASE + 1000], x: [1, 4], y: [0, 0] });
  });

  it("returns empty arrays for no rows", () => {
    expect(downsample([], 1000)).toEqual({ t: [], x: [], y: [] });
  });
});

describe("hasPosition", () => {
  it("rejects OpenF1's placeholder samples at the origin", () => {
    expect(hasPosition(location(0, 0, 0))).toBe(false);
  });

  it("keeps a sample with any non-zero axis", () => {
    expect(hasPosition(location(0, 5, 0))).toBe(true);
    expect(hasPosition(location(0, 0, 5))).toBe(true);
    expect(hasPosition({ ...location(0, 0, 0), z: 5 })).toBe(true);
  });
});

describe("fastestLapTrack", () => {
  // Driver 1 has a sample every 100 ms for 200 s, with x equal to the time in ms
  const rows = Array.from({ length: 2000 }, (_, i) => location(i * 100, i * 100));
  const rowsByDriver = new Map([[1, rows]]);

  it("slices the fastest lap's window at full resolution", () => {
    const laps = [
      lap({ lap_number: 2, date_start: new Date(BASE).toISOString(), lap_duration: 90 }),
      lap({ lap_number: 3, date_start: new Date(BASE + 90_000).toISOString(), lap_duration: 10 }),
    ];
    const track = fastestLapTrack(laps, rowsByDriver);
    expect(track.x[0]).toBe(90_000);
    expect(track.x.at(-1)).toBe(100_000);
    expect(track.x).toHaveLength(101);
  });

  it("skips lap 1, out laps and laps without a duration", () => {
    const laps = [
      lap({ lap_number: 1, lap_duration: 5 }),
      lap({ lap_number: 4, lap_duration: 6, is_pit_out_lap: true }),
      lap({ lap_number: 5, lap_duration: null }),
      lap({ lap_number: 6, date_start: new Date(BASE + 50_000).toISOString(), lap_duration: 20 }),
    ];
    expect(fastestLapTrack(laps, rowsByDriver).x[0]).toBe(50_000);
  });

  it("falls back to the next fastest lap when one has too few samples", () => {
    const laps = [
      lap({ driver_number: 2, lap_duration: 5 }),
      lap({ driver_number: 1, date_start: new Date(BASE + 10_000).toISOString(), lap_duration: 20 }),
    ];
    expect(fastestLapTrack(laps, rowsByDriver).x[0]).toBe(10_000);
  });

  it("skips a lap with a hole in its samples", () => {
    // Samples stop at 200 s, so this lap's window runs past the end of the data
    const gappyRows = rows.filter((row) => {
      const ms = Date.parse(row.date) - BASE;
      return ms < 30_000 || ms > 35_000;
    });
    const laps = [
      lap({ lap_number: 2, date_start: new Date(BASE + 20_000).toISOString(), lap_duration: 20 }),
      lap({ lap_number: 3, date_start: new Date(BASE + 190_000).toISOString(), lap_duration: 15 }),
      lap({ lap_number: 4, date_start: new Date(BASE + 60_000).toISOString(), lap_duration: 30 }),
    ];
    expect(fastestLapTrack(laps, new Map([[1, gappyRows]])).x[0]).toBe(60_000);
  });

  it("returns an empty track when no lap qualifies", () => {
    expect(fastestLapTrack([lap({ lap_number: 1 })], rowsByDriver)).toEqual({ x: [], y: [], sectorStarts: [] });
  });

  it("marks where sectors 2 and 3 start from the lap's sector times", () => {
    const laps = [lap({ lap_duration: 90, duration_sector_1: 30, duration_sector_2: 25.05, duration_sector_3: 34.95 })];
    const track = fastestLapTrack(laps, rowsByDriver);
    // Samples are 100 ms apart, so sector 3's boundary at 55.05 s falls to the next sample at 55.1 s
    expect(track.sectorStarts).toEqual([300, 551]);
  });

  it("leaves sectors out when the lap has no sector times", () => {
    expect(fastestLapTrack([lap({ duration_sector_1: null })], rowsByDriver).sectorStarts).toEqual([]);
  });
});

describe("mapWithConcurrency", () => {
  it("keeps input order and never exceeds the limit", async () => {
    let active = 0;
    let peak = 0;
    const result = await mapWithConcurrency([30, 10, 20, 5, 15], 2, async (ms) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, ms));
      active--;
      return ms * 2;
    });
    expect(result).toEqual([60, 20, 40, 10, 30]);
    expect(peak).toBe(2);
  });
});
