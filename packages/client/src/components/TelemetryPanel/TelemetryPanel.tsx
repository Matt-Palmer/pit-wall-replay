import './telemetry-panel.css';

// Static placeholder data: swap for the selected driver's telemetry when wiring it up
const DRIVER = {
	code: 'NOR',
	teamColour: '#FF8000',
	position: 2,
	gap: '+1.842',
	speed: 318,
	gear: 8,
	drs: true,
	throttle: 100,
	brake: 0,
	lastLap: { s1: '28.390', s2: '33.871', s3: '25.096', time: '1:27.357' },
	bestLap: '1:27.104',
	compound: 'Medium',
	compoundColour: '#F5D33F',
	tyreAge: 15,
	stops: '1 stop',
};

export function TelemetryPanel() {
	return (
		<section className="telemetry panel" aria-label="Driver telemetry">
			<div className="telemetry__driver">
				<span className="telemetry__team" style={{ '--team-colour': DRIVER.teamColour } as React.CSSProperties} aria-hidden="true" />
				<div>
					<p className="telemetry__code">{DRIVER.code}</p>
					<p className="telemetry__meta">P{DRIVER.position} · {DRIVER.gap}</p>
				</div>
				<h2 className="panel__title telemetry__title">Telemetry</h2>
			</div>

			<div className="telemetry__stats">
				<div className="telemetry__stat">
					<p className="telemetry__label">Speed</p>
					<p className="telemetry__value">{DRIVER.speed}<span> km/h</span></p>
				</div>
				<div className="telemetry__stat">
					<p className="telemetry__label">Gear · DRS</p>
					<div className="telemetry__gear">
						<p className="telemetry__value">{DRIVER.gear}</p>
						<span className={DRIVER.drs ? 'telemetry__drs is-open' : 'telemetry__drs'}>DRS</span>
					</div>
				</div>
			</div>

			<div className="telemetry__pedals">
				<div className="telemetry__pedal">
					<span className="telemetry__label">Throttle</span>
					<div className="telemetry__bar"><div className="telemetry__bar-fill telemetry__bar-fill--throttle" style={{ width: `${DRIVER.throttle}%` }} /></div>
					<span className="telemetry__pct">{DRIVER.throttle}%</span>
				</div>
				<div className="telemetry__pedal">
					<span className="telemetry__label">Brake</span>
					<div className="telemetry__bar"><div className="telemetry__bar-fill telemetry__bar-fill--brake" style={{ width: `${DRIVER.brake}%` }} /></div>
					<span className="telemetry__pct">{DRIVER.brake}%</span>
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
						<td>{DRIVER.lastLap.s1}</td>
						<td className="is-personal-best">{DRIVER.lastLap.s2}</td>
						<td>{DRIVER.lastLap.s3}</td>
						<td className="is-lap-time">{DRIVER.lastLap.time}</td>
					</tr>
					<tr>
						<th scope="row">Best</th>
						<td className="is-empty">–</td>
						<td className="is-empty">–</td>
						<td className="is-empty">–</td>
						<td className="is-best">{DRIVER.bestLap}</td>
					</tr>
				</tbody>
			</table>

			<p className="telemetry__tyre">
				<span className="tyre-pill" style={{ '--tyre-colour': DRIVER.compoundColour } as React.CSSProperties}>{DRIVER.compound.charAt(0)}</span>
				{DRIVER.compound} · {DRIVER.tyreAge} laps old · {DRIVER.stops}
			</p>
		</section>
	);
}
