import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchMeeting } from '../lib/queries';

export function useMeeting(meetingKey: number | undefined) {
  const { data: meeting, isLoading, isPending, error } = useQuery({
    queryKey: ['meeting', meetingKey],
    queryFn: meetingKey ? ({ signal }) => fetchMeeting(meetingKey, signal) : skipToken,
    enabled: !!meetingKey,
    staleTime: Infinity,
  });

  return { meeting, isLoading, isPending, error }; 
}