import { useParams } from 'react-router-dom';
import { useSessionTimeline } from '../hooks/useSessionTimeline';
import { leaderLapAt, standingAt } from '../lib/timeline';
import { useMemo, useState } from 'react';
import { RaceScrubber } from '../components/RaceScrubber';

import DriverList from '../components/Driver/DriverList';

import '../styles/driversPanel.css';
import '../styles/sessions.css';

import PositionPerLapD3 from '../components/Charts/PositionPerLapD3';
import { useMeeting } from '../hooks/useMeeting';
import { useSession } from '../hooks/useSession';
import { SessionHeader } from '../components/SessionHeader/SessionHeader';
import { SessionHeaderSkeleton } from '../components/SessionHeader/SessionHeaderSkeleton';
import { RaceScrubberSkeleton } from '../components/RaceScrubberSkeleton';
import DriverListSkeleton from '../components/Driver/DriverListSkeleton';
import PositionPerLapSkeleton from '../components/Charts/PositionPerLapSkeleton';
import TrackMap from '../components/TrackMap/TrackMap';
import { Skeleton } from '../components/Skeleton/Skeleton';
import { useSessionLocations } from '../hooks/useSessionLocations';

function Session() {
  const { sessionKey } = useParams();

	const { session } = useSession(sessionKey);
  const { timeline, drivers, isLoading, error } = useSessionTimeline(sessionKey);
	const { meeting, isLoading: isMeetingLoading, error: meetingError } = useMeeting(session?.meeting_key); 

	const { locations, isLoading: isLocationsLoading, error: locationsError } = useSessionLocations(sessionKey);

	const [raceTimeMs, setRaceTimeMs] = useState(0);
	// The time under the scrubber while it is being dragged; only the map follows it live
	const [scrubMs, setScrubMs] = useState<number | null>(null);
	const mapTimeMs = scrubMs ?? raceTimeMs;
	const [hoveredDriver, setHoveredDriver] = useState<number | null>(null);

	const driversMap = useMemo(() => new Map(drivers?.map(driver => [driver.driver_number, driver])), [drivers]);

	const standings = useMemo(() => (timeline ? standingAt(timeline, driversMap, timeline.start + raceTimeMs) : []), [timeline, driversMap, raceTimeMs]);

	const leaderLap = timeline ? leaderLapAt(timeline.leaderLapStarts, timeline.start + raceTimeMs) : 0;
	const totalLaps = timeline?.leaderLapStarts.length || 0;

  return (
		<div className="session">
			{meeting ? (
				<SessionHeader meeting={meeting} />
			) : meetingError ? (
				<div>Error loading meeting: {meetingError.message}</div>
			) : (
				<SessionHeaderSkeleton />
			)}

			{error && <div>Error: {error.message}</div>}
			<div className="session-grid">
				<div className="session-grid__drivers">
					{isLoading ? (
						<DriverListSkeleton />
					) : (
						!error && (
							<DriverList
								standings={standings}
								leaderLap={leaderLap}
								totalLaps={totalLaps}
								hoveredDriver={hoveredDriver}
								onHoverDriver={setHoveredDriver}
							/>
						)
					)}
				</div>

				<div className="session-grid__map">
					<div className="session-grid__map-image">
						{locationsError ? (
							<div>Error loading car positions: {locationsError.message}</div>
						) : isLocationsLoading || !locations || !timeline ? (
							<Skeleton className="track-map-skeleton" height="100%" radius={8} />
						) : (
							<TrackMap
								locations={locations}
								driversMap={driversMap}
								stoppedAt={timeline.stoppedAt}
								t={timeline.start + mapTimeMs}
								hoveredDriver={hoveredDriver}
								onHoverDriver={setHoveredDriver}
							/>
						)}
					</div>

					{isLoading ? (
						<RaceScrubberSkeleton />
					) : (
						<RaceScrubber
							timeMs={raceTimeMs}
							onTimeChange={setRaceTimeMs}
							onScrub={setScrubMs}
							leaderLapStarts={timeline?.leaderLapStarts ?? []}
							start={timeline?.start || 0}
							end={timeline?.end || 0}
						/>
					)}
				</div>

				<div className="session-grid__table1">
					{/* TODO: data table */}
				</div>

				<div className="session-grid__table2">
					{/* TODO: data table */}
				</div>

				<div className="session-grid__lap">
					{isLoading ? (
						<PositionPerLapSkeleton />
					) : (
						timeline && (
							<PositionPerLapD3
								timeline={timeline}
								driversMap={driversMap}
								t={timeline.start + raceTimeMs}
								totalLaps={totalLaps}
							/>
						)
					)}
				</div>
			</div>
		</div>
	);
}

export default Session;
