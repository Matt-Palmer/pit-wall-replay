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
import { usePlayback } from '../hooks/usePlayback';
import { TelemetryPanel } from '../components/TelemetryPanel/TelemetryPanel';
import { RaceControl } from '../components/RaceControl/RaceControl';

// Shared so the fallback keeps the same identity between renders
const NO_LAPS: number[] = [];

function Session() {
  const { sessionKey } = useParams();

	const { session } = useSession(sessionKey);
  const { timeline, drivers, isLoading, error } = useSessionTimeline(sessionKey);
	const { meeting, error: meetingError } = useMeeting(session?.meeting_key); 

	const { locations, isLoading: isLocationsLoading, error: locationsError } = useSessionLocations(sessionKey);

	// The time under the scrubber while it is being dragged; only the map follows it live
	const [scrubMs, setScrubMs] = useState<number | null>(null);
	const playback = usePlayback({
		leaderLapStarts: timeline?.leaderLapStarts ?? NO_LAPS,
		start: timeline?.start ?? 0,
		end: timeline?.end ?? 0,
		suspended: scrubMs !== null,
	});
	const raceTimeMs = playback.timeMs;
	const mapTimeMs = scrubMs ?? raceTimeMs;

	const [hoveredDriver, setHoveredDriver] = useState<number | null>(null);
	const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

	const driversMap = useMemo(() => new Map(drivers?.map(driver => [driver.driver_number, driver])), [drivers]);

	const standings = useMemo(() => (timeline ? standingAt(timeline, driversMap, timeline.start + raceTimeMs) : []), [timeline, driversMap, raceTimeMs]);
	const selectedRow = selectedDriver !== null ? standings.find(row => row.driverNumber === selectedDriver) : null;

	console.log(selectedRow);

	const leaderLap = timeline ? leaderLapAt(timeline.leaderLapStarts, timeline.start + raceTimeMs) : 0;
	const totalLaps = timeline?.leaderLapStarts.length || 0;

	function toggleSelectedDriver(driverNumber: number) {
		setSelectedDriver(prev => (prev === driverNumber ? null : driverNumber));
	}

  return (
		<div className="session">
			{/* Sized to the space between the app header and the scrubber, so the map and timing are always in view */}
			<div className="session-viewport">
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
									selectedDriver={selectedDriver}
									onHoverDriver={setHoveredDriver}
									onSelectDriver={toggleSelectedDriver}
								/>
							)
						)}
					</div>

					<div className="session-grid__map">
						<div className="session-grid__map-header">
							<h2 className="panel__title">Track</h2>
							<div className="track-map-legend">
								<span style={{ '--sector-colour': 'var(--pw-sector-1)' } as React.CSSProperties}>Sector 1</span>
								<span style={{ '--sector-colour': 'var(--pw-sector-2)' } as React.CSSProperties}>Sector 2</span>
								<span style={{ '--sector-colour': 'var(--pw-sector-3)' } as React.CSSProperties}>Sector 3</span>
							</div>
						</div>
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
									selectedDriver={selectedDriver}
									onHoverDriver={setHoveredDriver}
									onSelectDriver={toggleSelectedDriver}
								/>
							)}
						</div>
					</div>

					<div className="session-grid__side">
						<div className="session-grid__telemetry">
							{/* TODO: wire up to the selected driver */}
							<TelemetryPanel />
						</div>

						<div className="session-grid__control">
							{/* TODO: wire up to race control messages */}
							<RaceControl />
						</div>
					</div>
				</div>
			</div>

			<div className="session-lap">
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

			<footer className="session-scrubber">
				{isLoading ? (
					<RaceScrubberSkeleton />
				) : (
					<RaceScrubber
						timeMs={raceTimeMs}
						onTimeChange={playback.seek}
						onScrub={setScrubMs}
						leaderLapStarts={timeline?.leaderLapStarts ?? NO_LAPS}
						start={timeline?.start || 0}
						end={timeline?.end || 0}
						playback={playback.state}
						onTogglePlay={playback.togglePlay}
						onSpeed={playback.setSpeed}
						onHold={playback.hold}
						onRelease={playback.release}
						onNextLap={playback.nextLap}
						onPrevLap={playback.prevLap}
					/>
				)}
			</footer>
		</div>
	);
}

export default Session;
