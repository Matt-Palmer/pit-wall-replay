import { sessionsSchema } from '../../../shared/src/schemas/session';
import { driversSchema } from '../../../shared/src/schemas/driver';
import { lapsSchema } from '../../../shared/src/schemas/lap';
import { ApiError } from './helpers';

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