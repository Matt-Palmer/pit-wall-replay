import type { CarTrack, Lap, Location, SessionLocations } from "@pitwall/shared";

// A clean lap with fewer samples than this is treated as missing data
const MIN_TRACK_POINTS = 20;

// Keeps the first sample in each bucketMs window, as parallel arrays in time order.
export function downsample(rows: Location[], bucketMs: number): CarTrack {
  const sorted = rows
    .map((row) => ({ t: Date.parse(row.date), x: row.x, y: row.y }))
    .sort((a, b) => a.t - b.t);

  const track: CarTrack = { t: [], x: [], y: [] };
  let lastBucket = -Infinity;

  for (const sample of sorted) {
    const bucket = Math.floor(sample.t / bucketMs);
    if (bucket === lastBucket) continue;
    lastBucket = bucket;
    track.t.push(sample.t);
    track.x.push(sample.x);
    track.y.push(sample.y);
  }

  return track;
}

// The circuit outline at full resolution, from the fastest clean lap that has enough location samples.
export function fastestLapTrack(laps: Lap[], rowsByDriver: Map<number, Location[]>): SessionLocations["track"] {
  // Lap 1 starts from the grid and out laps start in the pit lane, so neither traces the circuit
  const candidates = laps
    .filter((lap) => lap.lap_number > 1 && !lap.is_pit_out_lap && lap.date_start && lap.lap_duration != null)
    .sort((a, b) => a.lap_duration! - b.lap_duration!);

  for (const lap of candidates) {
    const start = Date.parse(lap.date_start!);
    const end = start + lap.lap_duration! * 1000;

    const samples = (rowsByDriver.get(lap.driver_number) ?? [])
      .map((row) => ({ t: Date.parse(row.date), x: row.x, y: row.y }))
      .filter((sample) => sample.t >= start && sample.t <= end)
      .sort((a, b) => a.t - b.t);

    if (samples.length >= MIN_TRACK_POINTS) {
      return { x: samples.map((s) => s.x), y: samples.map((s) => s.y) };
    }
  }

  return { x: [], y: [] };
}

// Runs fn over items with at most `limit` calls in flight, keeping the input order.
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
