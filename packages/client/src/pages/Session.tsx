import { useParams } from 'react-router-dom';
import { useSessionTimeline } from '../hooks/useSessionTimeline';
import { standingAt } from '../lib/timeline';
import { useMemo, useState } from 'react';
import { RaceScrubber } from '../components/RaceScrubber';

import DriverList from '../components/Driver/DriverList';

import '../styles/driversPanel.css';

function Session() {
  const { sessionKey } = useParams();

  const { timeline, drivers, isLoading, error } = useSessionTimeline(sessionKey);

	const [raceTimeMs, setRaceTimeMs] = useState(0);

	const driversMap = useMemo(() => new Map(drivers?.map(driver => [driver.driver_number, driver])), [drivers]);

	const standings = useMemo(() => (timeline ? standingAt(timeline, driversMap, timeline.start + raceTimeMs) : []), [timeline, driversMap, raceTimeMs]);

	const leaderLap = standings.find(s => s.position === 1)?.lap || 0;
	const totalLaps = timeline?.leaderLapStarts.length || 0;

  return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
			{isLoading && <div>Loading...</div>}
			{error && <div>Error: {error.message}</div>}
			<RaceScrubber
				timeMs={raceTimeMs}
				onTimeChange={setRaceTimeMs}
				leaderLapStarts={totalLaps}
				leaderLap={leaderLap}
				start={timeline?.start || 0}
				end={timeline?.end || 0}
			/>
			{!isLoading && !error && <DriverList standings={standings} leaderLap={leaderLap} totalLaps={totalLaps} />}
		</div>
	);
}

export default Session;
