import DriverListItem from './DriverListItem';
import type { StandingRow } from '../../lib/timeline';
import { useState } from 'react';

interface DriverListProps {
	standings: StandingRow[];
	leaderLap: number;
	totalLaps: number
	hoveredDriver: number | null;
	onHoverDriver: (driverNumber: number | null) => void;
}

const DISPLAYED_DATA_OPTIONS: Record<string, string> = {
	interval: 'Interval',
	gapToLeader: 'Gap to Leader',
};

function DriverList({ standings, leaderLap, totalLaps, hoveredDriver, onHoverDriver }: DriverListProps) {
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
			<h3 style={{ textAlign: "center" }}>{leaderLap} / {totalLaps}</h3>
			<div style={{ textAlign: "center", marginBottom: "1rem" }}>
				<span onClick={onPreviousDisplayedData}>&lt;</span>
				<span style={{ margin: "0 1rem" }}>{DISPLAYED_DATA_OPTIONS[displayedData]}</span>
				<span onClick={onNextDisplayedData}>&gt;</span>
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
							onHover={onHoverDriver}
						/>
				))}
			</ul>
		</div>
	);
}

export default DriverList;