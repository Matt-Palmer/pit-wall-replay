import type { CarTrack, Lap, Location, SessionLocations } from "@pitwall/shared";

// A clean lap with fewer samples than this is treated as missing data
const MIN_TRACK_POINTS = 20;
// A lap with a longer hole than this, including at either end, would draw a chord across the circuit
const MAX_TRACK_GAP_MS = 2000;

// OpenF1 sends samples at the origin when it has no position for the car
export function hasPosition(row: Location): boolean {
  return row.x !== 0 || row.y !== 0 || row.z !== 0;
}

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

    if (samples.length >= MIN_TRACK_POINTS && coversWindow(samples.map((s) => s.t), start, end)) {
      return {
        x: samples.map((s) => s.x),
        y: samples.map((s) => s.y),
        sectorStarts: sectorStarts(lap, start, samples.map((s) => s.t)),
      };
    }
  }

  return { x: [], y: [], sectorStarts: [] };
}

// The first sample index of sectors 2 and 3, found from the lap's sector times
function sectorStarts(lap: Lap, start: number, times: number[]): number[] {
  if (lap.duration_sector_1 == null || lap.duration_sector_2 == null) return [];

  const sector2 = start + lap.duration_sector_1 * 1000;
  const sector3 = sector2 + lap.duration_sector_2 * 1000;
  const indexes = [sector2, sector3].map((boundary) => times.findIndex((t) => t >= boundary));

  // A boundary past the last sample means the sector times don't fit this lap's samples
  return indexes.every((i) => i > 0) ? indexes : [];
}

// Whether sorted sample times leave no hole longer than MAX_TRACK_GAP_MS between start and end
function coversWindow(times: number[], start: number, end: number): boolean {
  let previous = start;
  for (const t of [...times, end]) {
    if (t - previous > MAX_TRACK_GAP_MS) return false;
    previous = t;
  }
  return true;
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
