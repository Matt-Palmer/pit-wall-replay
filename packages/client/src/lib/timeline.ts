import type { Driver } from '../../../shared/src/schemas/driver';
import type { TyreCompound } from '../../../shared/src/compounds';
import type { CarTrack } from '../../../shared/src/schemas/location';
import type { SessionTimeline } from '../hooks/useSessionTimeline';

export type StandingRow = {
  driver: Driver | undefined;
  driverNumber: number;
  position: number | undefined;
  gapToLeader: number | string | null | undefined;
  interval: number | string | null | undefined;
  lap: number | undefined;
  compound: TyreCompound | undefined;
  tyreAge: number | undefined;
  // Set once the driver has stopped running, to the time they stopped
  outAt: number | undefined;
}

export type LapPosition = {
  lap: number | undefined;
  position: number;
  t: number;
}

// Finds the latest element in a sorted array whose `t` value is at or before the target time.
export function latestAtOrBefore<T extends { t: number }>(sorted: T[], target: number): T | undefined {
  let low = 0;
  let high = sorted.length - 1;
  let result: T | undefined;

  while (low <= high) {
    //Get the middle index of the current search range
    const mid = Math.floor((low + high) / 2);

    // If no element exists at the middle index, break out of the loop
    if (!sorted[mid]) break;

    // If the middle element's `t` value is less than or equal to the target, it is a candidate for the result. Move the search range to the right half.
    if (sorted[mid].t <= target) {
      result = sorted[mid];
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

// Number of laps the leader has started by time t (0 before the first lap starts).
export function leaderLapAt(leaderLapStarts: number[], t: number): number {
  let low = 0;
  let high = leaderLapStarts.length;

  // Find the first index whose start time is after t; that index is the count of laps started.
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (leaderLapStarts[mid]! <= t) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

// Beyond this gap between samples the car is held at its last point rather than slid across the map
const MAX_INTERPOLATION_GAP_MS = 5000;

// Where a car is at time t, interpolated between location samples. Undefined once the car has stopped running.
export function carPositionAt(car: CarTrack, t: number, stoppedAt?: number): { x: number; y: number } | undefined {
  if (car.t.length === 0) return undefined;
  if (stoppedAt !== undefined && t >= stoppedAt) return undefined;

  // Index of the last sample at or before t, or -1 if t is before the first sample
  let low = 0;
  let high = car.t.length - 1;
  let i = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (car.t[mid]! <= t) {
      i = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // Before the first sample the car is on the grid
  if (i === -1) return { x: car.x[0]!, y: car.y[0]! };

  const x0 = car.x[i]!;
  const y0 = car.y[i]!;
  const t1 = car.t[i + 1];
  if (t1 === undefined || t1 - car.t[i]! > MAX_INTERPOLATION_GAP_MS) return { x: x0, y: y0 };

  const ratio = (t - car.t[i]!) / (t1 - car.t[i]!);
  return { x: x0 + (car.x[i + 1]! - x0) * ratio, y: y0 + (car.y[i + 1]! - y0) * ratio };
}

export function standingAt(timeline: SessionTimeline, driversMap: Map<number, Driver>, t: number): StandingRow[] {
  // Implementation goes here
  const rows: StandingRow[] = [];

  for (const [driverNumber, streams] of timeline.byDriver) {
    const lap = latestAtOrBefore(streams.laps, t)?.lap_number;
    const stint = lap === undefined ? streams.stints[0] : streams.stints.find((s) => (s.lap_start ?? 0) <= lap && lap <= (s.lap_end ?? Infinity));
    const interval = latestAtOrBefore(streams.intervals, t)
    const stoppedAt = timeline.stoppedAt.get(driverNumber);

    rows.push({
      driver: driversMap.get(driverNumber),
      driverNumber,
      position: latestAtOrBefore(streams.positions, t)?.position,
      gapToLeader: interval?.gap_to_leader,
      interval: interval?.interval,
      lap,
      compound: stint?.compound ?? undefined,
      tyreAge: stint && lap !== undefined ? stint.tyre_age_at_start + (lap - (stint.lap_start ?? lap)) : stint?.tyre_age_at_start,
      outAt: stoppedAt !== undefined && t >= stoppedAt ? stoppedAt : undefined,
    });

  }
  return rows.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
}

export function lapPositions(timeline: SessionTimeline): Map<number, LapPosition[]> {
  const result = new Map<number, LapPosition[]>();
  // When the last car to complete each lap did so, indexed by lap number
  const fieldLapEnds: number[] = [];

  // Iterate over each driver and calculate their lap positions
  for (const [driverNumber, streams] of timeline.byDriver) {
    const points: LapPosition[] = [];

    // Add the grid position for the driver at the start of the session as lap 0
    const firstLap = streams.laps[0];
    const grid = firstLap && latestAtOrBefore(streams.positions, firstLap.t)?.position;
    if (grid !== undefined) points.push({
      lap: 0,
      position: grid,
      t: timeline.start,
    });

    // Iterate over each lap and calculate the position at the end of the lap
    streams.laps.forEach((lap, i) => {
      // Determine the time at which the current lap is considered complete
      const nextLap = streams.laps[i + 1];
      let lapCompletionTime: number;

      if (nextLap) {
        // If there is a next lap, consider the current lap complete at the start of the next lap
        lapCompletionTime = nextLap.t;
      } else if (lap.lap_duration != null) {
        // A final lap with a duration is the driver finishing. Positions keep settling for a few
        // seconds after the line is crossed, so read the finishing position once the session ends.
        lapCompletionTime = Math.max(lap.t + lap.lap_duration * 1000, timeline.end);
      } else {
        return;
      }

      // Get the position of the driver at the time the lap is considered complete
      const position = latestAtOrBefore(streams.positions, lapCompletionTime)?.position;
      // If the position is undefined, skip adding this lap position
      if (position === undefined) return;

      // Add the lap position to the points array
      points.push({
        lap: lap.lap_number,
        position,
        t: lapCompletionTime,
      });
      fieldLapEnds[lap.lap_number] = Math.max(fieldLapEnds[lap.lap_number] ?? -Infinity, lapCompletionTime);
    });

    // Store the calculated lap positions for the current driver in the result map
    result.set(driverNumber, points);
  }

  // A driver who stopped running keeps getting a point for each remaining lap, so their line carries
  // on as they drop down the order. Every other driver's point is taken as they complete the lap,
  // after they have passed the stopped car, so this one is taken once the last car has completed it.
  const raceLaps = timeline.leaderLapStarts.length;
  for (const [driverNumber, points] of result) {
    if (!timeline.stoppedAt.has(driverNumber)) continue;
    const positions = timeline.byDriver.get(driverNumber)?.positions ?? [];

    for (let lap = (points.at(-1)?.lap ?? 0) + 1; lap <= raceLaps; lap++) {
      // Keep points in time order, in case the driver was already lapped when they stopped
      const lapCompletionTime = Math.max(fieldLapEnds[lap] ?? timeline.end, points.at(-1)?.t ?? -Infinity);
      const position = latestAtOrBefore(positions, lapCompletionTime)?.position;
      if (position === undefined) continue;
      points.push({ lap, position, t: lapCompletionTime });
    }
  }

  return result;
}