import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchSessionLocations } from '../lib/queries';

// Kept apart from useSessionTimeline, as this is the largest payload and the map is the only thing that needs it
export function useSessionLocations(sessionKey: string | undefined) {
  const query = useQuery({
    queryKey: ['session', 'locations', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSessionLocations(sessionKey, signal) : skipToken,
    staleTime: Infinity,
  });

  return { locations: query.data, isLoading: query.isPending, error: query.error };
}
