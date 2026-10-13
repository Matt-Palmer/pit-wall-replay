import DriverListItem from './DriverListItem';
import type { StandingRow } from '../../lib/timeline';
import { useState } from 'react';

interface DriverListProps {
	standings: StandingRow[];
	leaderLap: number;
	totalLaps: number
	hoveredDriver: number | null;
	selectedDriver: number | null;
	onHoverDriver: (driverNumber: number | null) => void;
	onSelectDriver: (driverNumber: number) => void;
}

const DISPLAYED_DATA_OPTIONS: Record<string, string> = {
	interval: 'Interval',
	gapToLeader: 'Gap to Leader',
};

function DriverList({ standings, leaderLap, totalLaps, hoveredDriver, selectedDriver, onHoverDriver, onSelectDriver }: DriverListProps) {
	const [displayedData, setDisplayedData] = useState('interval');

	function onNextDisplayedData() {
		const keys = Object.keys(DISPLAYED_DATA_OPTIONS);
		const currentIndex = keys.indexOf(displayedData);
		const nextIndex = (currentIndex + 1) % keys.length;

		const nextOption = keys[nextIndex];
		if (!nextOption) return; // Prevent cycling back to the first option
		setDisplayedData(nextOption);
	}

	function onPreviousDisplayedData() {
		const keys = Object.keys(DISPLAYED_DATA_OPTIONS);
		const currentIndex = keys.indexOf(displayedData);
		const previousIndex = (currentIndex - 1 + keys.length) % keys.length;
		const previousOption = keys[previousIndex];
		if (!previousOption) return; // Prevent cycling back to the last option
		setDisplayedData(previousOption);
	}

	if (standings.length === 0) return <p>No session data available.</p>;

  return (
		<div className="driver-list-container">
			<div className="driver-list__header">
				<h2 className="panel__title">Timing</h2>
				<p className="driver-list__lap">
					<span>Lap </span>{leaderLap}<span>/{totalLaps}</span>
				</p>
			</div>
			<div className="driver-list__toggle">
				<button type="button" onClick={onPreviousDisplayedData} aria-label="Previous column">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
				</button>
				<span aria-live="polite">{DISPLAYED_DATA_OPTIONS[displayedData]} · Tyre</span>
				<button type="button" onClick={onNextDisplayedData} aria-label="Next column">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
				</button>
			</div>
			<ul
				className="driver-list"
				>
				{standings.map((standing) => (
					<DriverListItem
							key={standing.driverNumber}
							row={standing}
							displayedData={displayedData}
							highlighted={standing.driverNumber === hoveredDriver}
							selected={standing.driverNumber === selectedDriver}
							onHover={onHoverDriver}
							onSelect={onSelectDriver}
						/>
				))}
			</ul>
		</div>
	);
}

export default DriverList;