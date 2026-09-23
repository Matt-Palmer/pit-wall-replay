import { skipToken, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { fetchSessionDrivers } from '../lib/queries';
import LapsPanel from '../components/LapsPanel';

import '../styles/driversPanel.css';

function Session() {
  const { sessionKey } = useParams();

  const { data: drivers, error: queryError, isLoading } = useQuery({
    queryKey: ['session', 'drivers', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSessionDrivers(sessionKey, signal) : skipToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
			{isLoading && <p>Loading...</p>}
			{queryError && <p>Error: {String(queryError)}</p>}
			<ul
				style={{
					listStyleType: "none",
					padding: 0,
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
					gap: "1rem",
				}}
			>
				{drivers?.map((driver) => (
					<li key={driver.driver_number}>
						<a
							href={`/drivers/${driver.driver_number}`}
							className="driver-card"
							style={
								{
									"--team-colour": `#${driver.team_colour}`,
								} as React.CSSProperties
							}
						>
							<img src={driver.headshot_url ?? ""} alt={driver.full_name} />
							<div className="driver-info">
								<p style={{ fontSize: "1.5rem" }}>{driver.driver_number}</p>
								<p>{driver.first_name}</p>
								<p style={{ fontSize: "1.5rem" }}>
									{driver.last_name.toUpperCase()}
								</p>
							</div>
						</a>
					</li>
				)) ?? <p>No session data available.</p>}
			</ul>
			<LapsPanel sessionKey={sessionKey} />
		</div>
	);
}

export default Session;
