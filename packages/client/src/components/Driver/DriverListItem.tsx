import type { StandingRow } from "../../lib/timeline";
import { TYRE_COMPOUND_COLOURS } from "../../constants/compounds";
import type { TyreCompound } from "@pitwall/shared";

function setTyreCompoundColour(compound: TyreCompound | undefined) {
	if (!compound) return '#cccccc';
	return TYRE_COMPOUND_COLOURS[compound];
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
					style={{ "--tyre-colour": setTyreCompoundColour(row.compound) } as React.CSSProperties}
					title={row.compound}
				>
					{row.compound?.charAt(0)}
				</span>
				<span className="driver-list-item__age" title="Tyre age (laps)">{row.tyreAge ?? ''}</span>
			</a>
		</li>
	);
}

export default DriverListItem;