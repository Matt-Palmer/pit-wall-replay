import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchSessionDrivers, fetchSessionLaps } from '../lib/queries';
import { useDeferredValue, useMemo, useState } from 'react';
import type { LapWithDriver } from '../../../shared/src/schemas/lap';
import LapTable from './LapTable';

type LapsPanelProps = {
  sessionKey: string | undefined;
};

const EMPTY_LAPS: LapWithDriver[] = [];

function LapsPanel({ sessionKey }: LapsPanelProps) {
    const [filter, setFilter] = useState("");
		const deferredFilter = useDeferredValue(filter);
    
	const {
		data: drivers,
	} = useQuery({
		queryKey: ["session", "drivers", sessionKey],
		queryFn: sessionKey
			? ({ signal }) => fetchSessionDrivers(sessionKey, signal)
			: skipToken,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	const {
		data: laps,
		error: lapsError,
		isLoading: lapsLoading,
	} = useQuery({
		queryKey: ["session", "laps", sessionKey],
		queryFn: sessionKey
			? ({ signal }) => fetchSessionLaps(sessionKey, signal)
			: skipToken,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	const lapsWithDrivers = useMemo(() => {
		if (!laps) return EMPTY_LAPS;
		const driversMap = new Map(
			drivers?.map((driver) => [driver.driver_number, driver]),
		);
		return laps.map((lap) => ({
			...lap,
			driver: driversMap.get(lap.driver_number),
		}));
	}, [laps, drivers]);

	const filteredLaps = useMemo(() => {
		if (!lapsWithDrivers) return EMPTY_LAPS;
		if (!deferredFilter) return lapsWithDrivers;
		return lapsWithDrivers.filter((lap) =>
			String(lap.driver_number).includes(deferredFilter),
		);
	}, [lapsWithDrivers, deferredFilter]);

	return (
		<>
			{lapsLoading && <p>Loading laps...</p>}
			{lapsError && <p>Error: {String(lapsError)}</p>}
			{!lapsLoading && !lapsError && laps?.length === 0 && (
				<p>No laps data available.</p>
			)}

			<input
				type="text"
				placeholder="Filter by driver number"
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
			/>

			<LapTable filteredLaps={filteredLaps} />
		</>
	);
}

export default LapsPanel;