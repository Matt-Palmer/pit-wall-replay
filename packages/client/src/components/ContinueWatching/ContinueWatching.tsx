import { Link } from 'react-router-dom';
import './continue-watching.css';

// Static placeholder data: swap for the last replay the viewer had open (e.g. from localStorage)
const LAST_REPLAY = {
	sessionKey: '0000',
	name: 'British Grand Prix',
	detail: 'Round 12 · Silverstone · 2025',
	lap: 34,
	totalLaps: 52,
};

export function ContinueWatching() {
	const progress = Math.round((LAST_REPLAY.lap / LAST_REPLAY.totalLaps) * 100);

	return (
		<section className="continue-watching panel" aria-label="Continue watching">
			<div className="continue-watching__race">
				<p className="continue-watching__eyebrow">Continue watching</p>
				<p className="continue-watching__name">{LAST_REPLAY.name}</p>
				<p className="continue-watching__detail">{LAST_REPLAY.detail}</p>
			</div>

			<div className="continue-watching__progress">
				<div className="continue-watching__progress-label">
					<span>Lap {LAST_REPLAY.lap} of {LAST_REPLAY.totalLaps}</span>
					<span>{progress}%</span>
				</div>
				<div className="continue-watching__bar">
					<div style={{ width: `${progress}%` }} />
				</div>
			</div>

			<Link to={`/race/${LAST_REPLAY.sessionKey}`} className="continue-watching__resume">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M7 4.5v15l13-7.5z" />
				</svg>
				Resume
			</Link>
		</section>
	);
}
