import type { StandingRow } from "../../lib/timeline";
import { getTyreColour } from "../../lib/helpers";



type DriverListItemProps = {
	row: StandingRow;
	displayedData: string;
	highlighted: boolean;
	selected: boolean;
	onHover: (driverNumber: number | null) => void;
	onSelect: (driverNumber: number) => void;
};

function DriverListItem({ row, displayedData, highlighted, selected, onHover, onSelect }: DriverListItemProps) {

	const className = ['driver-list-item', highlighted && 'is-highlighted', selected && 'is-selected'].filter(Boolean).join(' ').trim();

	function formatGapOrInterval(value: string | number | null | undefined) {
		if (row.outAt !== undefined) return "Out";
		if (value == null || value === 0) return "-";
		if (typeof value === 'string') return value;
		return `+${value.toFixed(3)}`;
	}

  return (
		<li key={row.driverNumber}>
			<button
				type="button"
				className={className}
				onPointerEnter={() => onHover(row.driverNumber)}
				onPointerLeave={() => onHover(null)}
				onClick={() => onSelect(row.driverNumber)}
				aria-pressed={selected}
				style={
					{
						"--team-colour": `#${row.driver?.team_colour}`,
					} as React.CSSProperties
				}
			>
				<span className="driver-list-item__position">{row.position}</span>
				<span className="driver-list-item__team" aria-hidden="true" />
				<span className="driver-list-item__code">
					{row.driver?.name_acronym}
				</span>

				<span className="driver-list-item__gap">
					{displayedData === "gapToLeader" && formatGapOrInterval(row.gapToLeader)}
					{displayedData === "interval" && formatGapOrInterval(row.interval)}
				</span>

				<span
					className="tyre-pill"
					style={{ "--tyre-colour": getTyreColour(row.compound) } as React.CSSProperties}
					title={row.compound}
				>
					{row.compound?.charAt(0)}
				</span>
				<span className="driver-list-item__age" title="Tyre age (laps)">{row.tyreAge ?? ''}</span>
			</button>
		</li>
	);
}

export default DriverListItem;