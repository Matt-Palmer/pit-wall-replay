import './race-control.css';

type RaceControlMessage = {
	lap: number;
	text: string;
	flag?: 'yellow';
};

// Static placeholder data: swap for OpenF1 race control messages up to the current replay time
const MESSAGES: RaceControlMessage[] = [
	{ lap: 33, text: 'HAM pits · Medium → Hard' },
	{ lap: 31, text: 'Fastest lap · NOR' },
	{ lap: 21, text: 'Safety car in this lap', flag: 'yellow' },
	{ lap: 18, text: 'Safety car deployed', flag: 'yellow' },
];

export function RaceControl() {
	return (
		<section className="race-control panel" aria-label="Race control">
			<h2 className="panel__title">Race control</h2>
			<ul className="race-control__list">
				{MESSAGES.map((message) => (
					<li key={`${message.lap}-${message.text}`} className="race-control__item">
						<span className="race-control__lap">L{message.lap}</span>
						<span className={message.flag === 'yellow' ? 'race-control__text is-yellow' : 'race-control__text'}>
							{message.text}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
