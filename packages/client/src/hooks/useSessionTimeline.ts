import { useMemo } from 'react';
import { skipToken, useQuery } from '@tanstack/react-query';
import { 
  fetchSessionDrivers,
  fetchSessionLaps,
  fetchSessionPositions,
  fetchSessionStints,
  fetchSessionIntervals,
  fetchSessionResult
} from '../lib/queries';
import { useSession } from './useSession';

import type { Lap } from '../../../shared/src/schemas/lap';
import type { Position } from '../../../shared/src/schemas/position';
import type { Stint } from '../../../shared/src/schemas/stint';
import type { Interval } from '../../../shared/src/schemas/intervals';

type Timed<T> = T & { t: number };

export type DriverStreams = {
  positions: Timed<Position>[];
  stints: Stint[];
  laps: Timed<Lap>[];
  intervals: Timed<Interval>[];
}

export type SessionTimeline = {
  byDriver: Map<number, DriverStreams>;
  start: number;
  end: number;
  leaderLapStarts: number[];
  // When each non-finishing driver stopped running, keyed by driver number
  stoppedAt: Map<number, number>;
}

const byTime = (a: { t: number }, b: { t: number }) => a.t - b.t;

export function useSessionTimeline(sessionKey: string | undefined) {
  // Hook logic here
  const common = { staleTime: Infinity, enabled: Boolean(sessionKey) };

  const sessionQuery = useSession(sessionKey);
  const session = sessionQuery.session;

  const lapsQuery = useQuery({
    queryKey: ['session', 'laps', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSessionLaps(sessionKey, signal) : skipToken,
    ...common
  });

  const positionsQuery = useQuery({
    queryKey: ['session', 'positions', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSessionPositions(sessionKey, signal) : skipToken,
    ...common
  });

  const stintsQuery = useQuery({
    queryKey: ['session', 'stints', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSessionStints(sessionKey, signal) : skipToken,
    ...common
  });

  const intervalsQuery = useQuery({
    queryKey: ['session', 'intervals', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSessionIntervals(sessionKey, signal) : skipToken,
    ...common
  });

  const driversQuery = useQuery({
    queryKey: ['session', 'drivers', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSessionDrivers(sessionKey, signal) : skipToken,
    ...common
  });

  const resultQuery = useQuery({
    queryKey: ['session', 'result', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSessionResult(sessionKey, signal) : skipToken,
    ...common
  });

  const laps = lapsQuery.data;
  const positions = positionsQuery.data;
  const stints = stintsQuery.data;
  const intervals = intervalsQuery.data;
  const drivers = driversQuery.data;
  // The result is only a bonus, so if it can't be fetched carry on without it
  const result = resultQuery.isError ? [] : resultQuery.data;

  const timeline = useMemo(() => {
    if (!session || !laps || !positions || !stints || !intervals || !drivers || !result) return undefined;

  const byDriver = new Map<number, DriverStreams>();
  const streamsFor = (driverNumber: number) => {
    let streams = byDriver.get(driverNumber);
    if (!streams) {
      streams = { positions: [], stints: [], laps: [], intervals: [] };
      byDriver.set(driverNumber, streams);
    }
    return streams;
  };

  for (const lap of laps) {
    if (lap.date_start) streamsFor(lap.driver_number).laps.push({ ...lap, t: Date.parse(lap.date_start) });
  }

  for (const position of positions) {
    if (position.date) streamsFor(position.driver_number).positions.push({ ...position, t: Date.parse(position.date) });
  }

  for (const stint of stints) streamsFor(stint.driver_number).stints.push(stint);

  for (const interval of intervals) {
    if (interval.date) streamsFor(interval.driver_number).intervals.push({ ...interval, t: Date.parse(interval.date) });
  }

  for (const streams of byDriver.values()) {
    streams.laps.sort(byTime);
    streams.positions.sort(byTime);
    streams.intervals.sort(byTime);
    streams.stints.sort((a, b) => a.stint_number - b.stint_number);
  }

  let start = Infinity;
  let end = -Infinity;
  const leaderLapStarts: number[] = [];

  for (const lap of laps) {
    if(!lap.date_start) continue;
    const t = Date.parse(lap.date_start);
    if (lap.lap_number === 1) start = Math.min(start, t);
    if (lap.lap_duration != null) end = Math.max(end, t + lap.lap_duration * 1000);
    const i = lap.lap_number - 1;
    leaderLapStarts[i] = Math.min(leaderLapStarts[i] ?? Infinity, t);
  }
  if (!Number.isFinite(start)) start = Date.parse(session.date_start);
  if (!Number.isFinite(end)) end = Date.parse(session.date_end);

  // A driver's last sign of life is their last lap start or interval sample
  const lastActive = new Map<number, number>();
  let activityEnd = -Infinity;
  for (const [driverNumber, streams] of byDriver) {
    const last = Math.max(streams.laps.at(-1)?.t ?? -Infinity, streams.intervals.at(-1)?.t ?? -Infinity);
    if (!Number.isFinite(last)) continue;
    lastActive.set(driverNumber, last);
    activityEnd = Math.max(activityEnd, last);
  }

  const stoppedAt = new Map<number, number>();
  if (result.length) {
    // The classified result says who didn't start or finish; activity says when they stopped.
    // Disqualifications are left out, as they usually happen after the car has finished.
    for (const entry of result) {
      if (entry.dns) stoppedAt.set(entry.driver_number, start);
      else if (entry.dnf) stoppedAt.set(entry.driver_number, lastActive.get(entry.driver_number) ?? start);
    }
  } else {
    // No result yet (e.g. a live session). Final laps have no duration, so there is no reliable
    // chequered-flag time; instead, finishers all go quiet within about a lap of each other,
    // and anyone who went quiet well before that stopped running.
    const durations = laps.flatMap((lap) => (lap.lap_duration == null ? [] : [lap.lap_duration])).sort((a, b) => a - b);
    const typicalLapMs = (durations[Math.floor(durations.length / 2)] ?? 90) * 1000;

    for (const driverNumber of byDriver.keys()) {
      const last = lastActive.get(driverNumber);
      // No laps or intervals at all means the driver never started
      if (last === undefined) stoppedAt.set(driverNumber, start);
      else if (last < activityEnd - 2 * typicalLapMs) stoppedAt.set(driverNumber, last);
    }
  }

  return { byDriver, start, end, leaderLapStarts, stoppedAt };

  }, [session, laps, positions, stints, intervals, drivers, result]);

  const queries = [sessionQuery, lapsQuery, positionsQuery, stintsQuery, intervalsQuery, driversQuery];

  return {
    timeline,
    drivers: driversQuery.data,
    isLoading: [...queries, resultQuery].some(query => query.isPending),
    error: queries.find(query => query.error)?.error ?? null
  };
}