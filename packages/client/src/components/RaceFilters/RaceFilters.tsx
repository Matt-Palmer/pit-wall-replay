import './race-filters.css';

type RaceFiltersProps = {
	count: number;
};

// Static for now: the filter buttons and search box aren't wired up yet
export function RaceFilters({ count }: RaceFiltersProps) {
	return (
		<div className="race-filters">
			<div className="race-filters__group" role="group" aria-label="Filter races">
				<button type="button" aria-pressed="true">All races</button>
				<button type="button" aria-pressed="false">Sprint weekends</button>
			</div>

			<div className="race-filters__search">
				<span className="race-filters__count">{count} races</span>
				<label className="race-filters__field">
					<span className="visually-hidden">Search races</span>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
						<circle cx="11" cy="11" r="7" />
						<path d="M20 20l-3.5-3.5" />
					</svg>
					<input type="search" placeholder="Search by race or circuit" />
				</label>
			</div>
		</div>
	);
}
