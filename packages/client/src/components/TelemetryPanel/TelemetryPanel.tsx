import './telemetry-panel.css';

import { getTyreColour, formatGapOrInterval, formatTyreAge } from '../../lib/helpers';
import type { StandingRow } from '../../lib/timeline';

interface TelemetryPanelProps {
	row: StandingRow;
}

export function TelemetryPanel({ row }: TelemetryPanelProps) {
	return (
		<section className="telemetry panel" aria-label="Driver telemetry">
			<h2 className="panel__title telemetry__title">Telemetry</h2>

			<div className="telemetry__header">
				<div className="telemetry__driver">
					<span
						className="telemetry__team"
						style={
							{
								"--team-colour": `#${row.driver?.team_colour}`,
							} as React.CSSProperties
						}
						aria-hidden="true"
					/>
					<div>
						<p className="telemetry__code">
							{row.driver?.name_acronym ?? "NS"}
						</p>
						<p className="telemetry__meta">
							{row.position !== 1 ? `Gap to leader: ${formatGapOrInterval(row.gapToLeader, row.outAt)}` : "Leader"}
						</p>
					</div>
				</div>
				<div className="telemetry__position">
					<p>P{row.position ?? "--"}</p>
				</div>
			</div>

			<div className="telemetry__stats">
				<div className="telemetry__stat">
					<p className="telemetry__label">Speed</p>
					<p className="telemetry__value">
						--<span> km/h</span>
					</p>
				</div>
				<div className="telemetry__stat">
					<p className="telemetry__label">Gear · DRS</p>
					<div className="telemetry__gear">
						<p className="telemetry__value">--</p>
						{/* // TODO: wire up to actual DRS status */}
						<span className={"telemetry__drs is-open"}>DRS</span>
					</div>
				</div>
			</div>

			<div className="telemetry__pedals">
				<div className="telemetry__pedal">
					<span className="telemetry__label">Throttle</span>
					<div className="telemetry__bar">
						<div
							className="telemetry__bar-fill telemetry__bar-fill--throttle"
							style={{ width: `--%` }}
						/>
					</div>
					<span className="telemetry__pct">--%</span>
				</div>
				<div className="telemetry__pedal">
					<span className="telemetry__label">Brake</span>
					<div className="telemetry__bar">
						<div
							className="telemetry__bar-fill telemetry__bar-fill--brake"
							style={{ width: `--%` }}
						/>
					</div>
					<span className="telemetry__pct">--%</span>
				</div>
			</div>

			<table className="telemetry__laps">
				<thead>
					<tr>
						<th scope="col">Lap</th>
						<th scope="col">S1</th>
						<th scope="col">S2</th>
						<th scope="col">S3</th>
						<th scope="col">Time</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">Last</th>
						<td>--</td>
						<td className="is-personal-best">--</td>
						<td>--</td>
						<td className="is-lap-time">--</td>
					</tr>
					<tr>
						<th scope="row">Best</th>
						<td className="is-empty">--</td>
						<td className="is-empty">--</td>
						<td className="is-empty">--</td>
						<td className="is-best">--</td>
					</tr>
				</tbody>
			</table>

			<p className="telemetry__tyre">
				<span
					className="tyre-pill"
					style={
						{
							"--tyre-colour": getTyreColour(row.compound),
						} as React.CSSProperties
					}
				>
					{row.compound?.charAt(0)}
				</span>

				<span className="telemetry__tyre-data">
					{row.compound && 
						<span>
								{row.compound.charAt(0) + row.compound.slice(1).toLocaleLowerCase()}
						</span>
					}
					{row.tyreAge !== undefined && <span>{formatTyreAge(row.tyreAge)}</span>}
				</span>
			</p>
		</section>
	);
}
