import { useState } from 'react'
import { noop, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSessions, fetchSessionDrivers } from './lib/queries';
import { Link } from 'react-router-dom';

const selectableYears: string[] = ['2026', '2025', '2024', '2023'];

function App() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<string>(selectableYears[0] ?? '2026');

  const { data, error: queryError, isLoading } = useQuery({
    queryKey: ['sessions', selectedYear],
    queryFn: ({ signal }) => fetchSessions(selectedYear, signal),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const prefetchedDrivers = (sessionKey: string) => {
    queryClient.query({
      queryKey: ['session', 'drivers', sessionKey],
      queryFn: ({ signal }) => fetchSessionDrivers(sessionKey, signal),
      staleTime: 1000 * 60 * 5, // 5 minutes
    }).catch(noop);
  };

  const sessionsData = data ?? [];

  return (
		<>
			<h2>Sessions for {selectedYear}</h2>
      <form>
        <label>
          Year:
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {selectableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          </label>
      </form>
			{isLoading ? (
				<p>Loading sessions...</p>
			) : (
				<>
					{queryError ? (
						<p>{queryError.message}</p>
					) : (
						sessionsData.length === 0 && (
							<p>No sessions available for this year.</p>
						)
					)}
					{sessionsData.length > 0 && (
						<ul>
							{sessionsData.map((session) => (
								<li key={session.session_key}>
                  <Link 
                    to={`/race/${session.session_key}`} 
                    onMouseEnter={() => prefetchedDrivers(String(session.session_key))}>
                      {session.circuit_short_name}
                  </Link>
                </li>
							))}
						</ul>
					)}
				</>
			)}
		</>
	);
}

export default App
