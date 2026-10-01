import type { StandingRow } from "../../lib/timeline";

function setTyreCompoundColour(compound: string | undefined) {
	switch (compound?.toLowerCase()) {
		case 'soft':
			return '#ff4c4c';
		case 'medium':
			return '#ffe11c';
		case 'hard':
			return '#f4f4f4';
		case 'intermediate':
			return '#00ff00';
		case 'wet':
			return '#0000ff';
		default:
			return '#cccccc';
	}
}

type DriverListItemProps = {
	row: StandingRow;
	displayedData: string;
	highlighted: boolean;
	onHover: (driverNumber: number | null) => void;
};

function DriverListItem({ row, displayedData, highlighted, onHover }: DriverListItemProps) {

	function formatGapOrInterval(value: string | number | null | undefined) {
		if (row.outAt !== undefined) return "Out";
		if (value == null || value === 0) return "-";
		if (typeof value === 'string') return value;
		return `+${value.toFixed(3)}`;
	}

  return (
		<li key={row.driverNumber}>
			<a
				href={`/drivers/${row.driverNumber}`}
				className={highlighted ? "driver-list-item is-highlighted" : "driver-list-item"}
				onPointerEnter={() => onHover(row.driverNumber)}
				onPointerLeave={() => onHover(null)}
				style={
					{
						"--team-colour": `#${row.driver?.team_colour}`,
					} as React.CSSProperties
				}
			>
				<p style={{ width: "2rem" }}>{row.position}</p>
				<p style={{ fontSize: "1.2rem", width: "4rem" }}>
					{row.driver?.name_acronym}
				</p>

				<div style={{flex: 1, textAlign: "center"}}>
					{displayedData === "gapToLeader" && (
						<p>{formatGapOrInterval(row.gapToLeader)}</p>
					)}
					{displayedData === "interval" && (
						<p>{formatGapOrInterval(row.interval)}</p>
					)}
				</div>

				<p
					className="tyre-compound"
					style={{ color: setTyreCompoundColour(row.compound), width: "2rem", textAlign: "center" }}
				>
					{row.compound?.charAt(0)}
				</p>
			</a>
		</li>
	);
}

export default DriverListItem;