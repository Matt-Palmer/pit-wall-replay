import type { Driver } from '../../../shared/src/schemas/driver';
import type { TyreCompound } from '../../../shared/src/compounds';
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

export function latestAtOrBefore<T extends { t: number }>(sorted: T[], target: number): T | undefined {
  let low = 0;
  let high = sorted.length - 1;
  let result: T | undefined;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (!sorted[mid]) break;
    if (sorted[mid].t <= target) {
      result = sorted[mid];
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
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