import { Skeleton } from '../Skeleton/Skeleton';

const ROW_COUNT = 20;

function DriverListSkeleton() {
  return (
		<div className="driver-list-container" aria-busy="true" aria-label="Loading drivers">
			<div style={{ display: "flex", justifyContent: "center" }}>
				<Skeleton width="4rem" height="1.4rem" />
			</div>
			<div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
				<Skeleton width="8rem" />
			</div>
			<ul className="driver-list">
				{Array.from({ length: ROW_COUNT }, (_, i) => (
					<li key={i}>
						<div
							className="driver-list-item"
							style={{ "--team-colour": "rgba(255, 255, 255, 0.08)" } as React.CSSProperties}
						>
							<Skeleton width="1rem" height="1.4rem" />
							<Skeleton width="3rem" height="1.4rem" />
							<div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
								<Skeleton width="4rem" />
							</div>
							<Skeleton width="1rem" />
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

export default DriverListSkeleton;
