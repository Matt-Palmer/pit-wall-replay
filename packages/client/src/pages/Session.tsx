import { useParams } from 'react-router-dom';
import { useSessionTimeline } from '../hooks/useSessionTimeline';
import { standingAt } from '../lib/timeline';
import { useMemo, useState } from 'react';
import { RaceScrubber } from '../components/RaceScrubber';

import DriverList from '../components/Driver/DriverList';

import '../styles/driversPanel.css';
import PositionPerLapD3 from '../components/Charts/PositionPerLapD3';
import { useMeeting } from '../hooks/useMeeting';
import { useSession } from '../hooks/useSession';
import { SessionHeader } from '../components/SessionHeader/SessionHeader';
import { SessionHeaderSkeleton } from '../components/SessionHeader/SessionHeaderSkeleton';
import { RaceScrubberSkeleton } from '../components/RaceScrubberSkeleton';
import DriverListSkeleton from '../components/Driver/DriverListSkeleton';
import PositionPerLapSkeleton from '../components/Charts/PositionPerLapSkeleton';

function Session() {
  const { sessionKey } = useParams();

	const { session } = useSession(sessionKey);
  const { timeline, drivers, isLoading, error } = useSessionTimeline(sessionKey);
	const { meeting, isLoading: isMeetingLoading, error: meetingError } = useMeeting(session?.meeting_key); 

	const [raceTimeMs, setRaceTimeMs] = useState(0);

	const driversMap = useMemo(() => new Map(drivers?.map(driver => [driver.driver_number, driver])), [drivers]);

	const standings = useMemo(() => (timeline ? standingAt(timeline, driversMap, timeline.start + raceTimeMs) : []), [timeline, driversMap, raceTimeMs]);

	const leaderLap = standings.find(s => s.position === 1)?.lap || 0;
	const totalLaps = timeline?.leaderLapStarts.length || 0;

  return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
			{meeting ? (
				<SessionHeader meeting={meeting} />
			) : meetingError ? (
				<div>Error loading meeting: {meetingError.message}</div>
			) : (
				<SessionHeaderSkeleton />
			)}

			{error && <div>Error: {error.message}</div>}
			{isLoading ? (
				<RaceScrubberSkeleton />
			) : (
				<RaceScrubber
					timeMs={raceTimeMs}
					onTimeChange={setRaceTimeMs}
					leaderLapStarts={totalLaps}
					leaderLap={leaderLap}
					start={timeline?.start || 0}
					end={timeline?.end || 0}
				/>
			)}
			<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
				{isLoading ? (
					<DriverListSkeleton />
				) : !error && (
					<DriverList
						standings={standings}
						leaderLap={leaderLap}
						totalLaps={totalLaps}
					/>
				)}

				{isLoading ? (
					<PositionPerLapSkeleton />
				) : timeline && (
					<PositionPerLapD3
						timeline={timeline}
						driversMap={driversMap}
						t={timeline.start + raceTimeMs}
						totalLaps={totalLaps}
					/>
				)}
			</div>
		</div>
	);
}

export default Session;
