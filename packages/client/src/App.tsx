import { useState } from 'react'
import { noop, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSessions, fetchSessionDrivers } from './lib/queries';
import { RaceCard } from './components/RaceCard/RaceCard';
import { ContinueWatching } from './components/ContinueWatching/ContinueWatching';
import { RaceFilters } from './components/RaceFilters/RaceFilters';
import { Skeleton } from './components/Skeleton/Skeleton';

import './styles/raceSelect.css';

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
    <main className="race-select">
      <div className="race-select__intro">
        <div className="race-select__heading">
          <p className="race-select__eyebrow">Select session</p>
          <h1>Choose a race to replay</h1>
          <p className="race-select__lede">
            Pick a Grand Prix and watch it back lap by lap, with timing, tyres and telemetry for every driver.
          </p>
        </div>

        <div className="segmented" role="group" aria-label="Season">
          {selectableYears.map((year) => (
            <button
              key={year}
              type="button"
              aria-pressed={selectedYear === year}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <ContinueWatching />

      <RaceFilters count={sessionsData.length} />

      {isLoading ? (
        <ul className="race-select__grid" aria-busy="true" aria-label="Loading races">
          {Array.from({ length: 12 }, (_, i) => (
            <li key={i}>
              <Skeleton height={168} radius={8} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          {queryError ? (
            <p className="race-select__message">{queryError.message}</p>
          ) : (
            sessionsData.length === 0 && (
              <p className="race-select__message">No sessions available for {selectedYear}.</p>
            )
          )}
          {sessionsData.length > 0 && (
            <ul className="race-select__grid">
              {sessionsData.map((session, index) => (
                <li key={session.session_key}>
                  <RaceCard
                    session={session}
                    round={index + 1}
                    onPrefetch={() => prefetchedDrivers(String(session.session_key))}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p id="about" className="race-select__footnote">
        Unofficial fan project, not affiliated with Formula 1. Timing data from OpenF1.
      </p>
    </main>
  );
}

export default App
