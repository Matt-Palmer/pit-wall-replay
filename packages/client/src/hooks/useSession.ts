import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchSession } from '../lib/queries';

export function useSession(sessionKey: string | undefined) {
  const { data: session, isLoading, isPending, error } = useQuery({
    queryKey: ['session', sessionKey],
    queryFn: sessionKey ? ({ signal }) => fetchSession(sessionKey, signal) : skipToken,
    enabled: !!sessionKey,
    staleTime: Infinity
  });

  return { session: session?.[0], isLoading, isPending, error };
}