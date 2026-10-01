import { sessionsSchema } from '../../../shared/src/schemas/session';
import { meetingsSchema } from '../../../shared/src/schemas/meeting';
import { driversSchema } from '../../../shared/src/schemas/driver';
import { lapsSchema } from '../../../shared/src/schemas/lap';
import { positionsSchema } from '../../../shared/src/schemas/position';
import { stintsSchema } from '../../../shared/src/schemas/stint';
import { ApiError } from './helpers';
import { intervalsSchema } from '../../../shared/src/schemas/intervals';
import { sessionResultsSchema } from '../../../shared/src/schemas/session-result';

export async function fetchSessions(year: string, signal?: AbortSignal) {
  const res = await fetch(`/api/sessions/${year}`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch sessions', res.status);
  
  const data = await res.json()
  const parsedData = sessionsSchema.safeParse(data)

  if (!parsedData.success) throw new ApiError('Invalid sessions reponse', undefined, { cause: parsedData.error });

  return parsedData.data;
}

export async function fetchSession(sessionKey: string, signal?: AbortSignal) {
  const res = await fetch(`/api/session/${sessionKey}`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch session', res.status);
  
  const data = await res.json()
  const parsedData = sessionsSchema.safeParse(data);

	if (!parsedData.success)
		throw new ApiError("Invalid sessions reponse", undefined, {
			cause: parsedData.error,
		});

	return parsedData.data;
}

export async function fetchMeeting(meetingKey: number, signal?: AbortSignal) {
  const res = await fetch(`/api/meeting/${meetingKey}`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch meeting', res.status);
  
  const data = await res.json()
  const parsedData = meetingsSchema.safeParse(data);

  if (!parsedData.success)
    throw new ApiError("Invalid meeting response", undefined, {
      cause: parsedData.error,
    });

  return parsedData.data[0];
}

export async function fetchSessionDrivers(sessionKey: string, signal?: AbortSignal) {
  const res = await fetch(`/api/session/${sessionKey}/drivers`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch session drivers', res.status);
  
  const data = await res.json()
  const parsedData = driversSchema.safeParse(data)

  if (!parsedData.success) throw new ApiError('Invalid session drivers response', undefined, { cause: parsedData.error });

  return parsedData.data;
}

export async function fetchSessionLaps(sessionKey: string, signal?: AbortSignal) {
  const res = await fetch(`/api/session/${sessionKey}/laps`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch session laps', res.status);
  
  const data = await res.json()
  const parsedData = lapsSchema.safeParse(data)

  if (!parsedData.success) throw new ApiError('Invalid session laps response', undefined, { cause: parsedData.error });

  return parsedData.data;
}

export async function fetchSessionPositions(sessionKey: string, signal?: AbortSignal) {
  const res = await fetch(`/api/session/${sessionKey}/positions`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch session positions', res.status);
  
  const data = await res.json()
  const parsedData = positionsSchema.safeParse(data)

  if (!parsedData.success) throw new ApiError('Invalid session positions response', undefined, { cause: parsedData.error });

  return parsedData.data;
}

export async function fetchSessionStints(sessionKey: string, signal?: AbortSignal) {
  const res = await fetch(`/api/session/${sessionKey}/stints`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch session stints', res.status);
  
  const data = await res.json()
  const parsedData = stintsSchema.safeParse(data)

  if (!parsedData.success) throw new ApiError('Invalid session stints response', undefined, { cause: parsedData.error });

  return parsedData.data;
}

export async function fetchSessionIntervals(sessionKey: string, signal?: AbortSignal) {
  const res = await fetch(`/api/session/${sessionKey}/intervals`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch session intervals', res.status);
  
  const data = await res.json()
  const parsedData = intervalsSchema.safeParse(data)

  if (!parsedData.success) throw new ApiError('Invalid session intervals response', undefined, { cause: parsedData.error });

  return parsedData.data;
}

export async function fetchSessionResult(sessionKey: string, signal?: AbortSignal) {
  const res = await fetch(`/api/session/${sessionKey}/result`, { signal })

  if (!res.ok) throw new ApiError('Failed to fetch session result', res.status);

  const data = await res.json()
  const parsedData = sessionResultsSchema.safeParse(data)

  if (!parsedData.success) throw new ApiError('Invalid session result response', undefined, { cause: parsedData.error });

  return parsedData.data;
}
