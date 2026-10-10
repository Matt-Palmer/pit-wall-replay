import { z } from "zod";
import { clearAccessToken, getAccessToken } from "./auth";
import { createRateLimiter, sleep } from "./rateLimit";

const BASE_URL = "https://api.openf1.org/v1/";
// OpenF1 allows 6 requests per second; stay one under to absorb network jitter
const OPENF1_REQUESTS_PER_SECOND = 5;
const MAX_RATE_LIMIT_RETRIES = 3;
const DEFAULT_RETRY_AFTER_MS = 1000;

// Shared by every route, since they all count towards the same limit
const acquireRequestSlot = createRateLimiter(OPENF1_REQUESTS_PER_SECOND, 1000);

function retryAfterMs(res: Response) {
  const seconds = Number(res.headers.get("Retry-After"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_RETRY_AFTER_MS;
}

async function fetchWithToken(url: URL) {
  await acquireRequestSlot();
  const token = await getAccessToken();
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

type FetchJsonOptions = {
  // OpenF1 answers 404 "No results found" when nothing matches; treat that as an empty list
  emptyOnNotFound?: boolean;
};

export async function fetchJson<S extends z.ZodType>(path: string, params: Record<string, string | number>, schema: S, options: FetchJsonOptions = {}): Promise<z.infer<S>> {
  const url = new URL(path, BASE_URL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  let res = await fetchWithToken(url);

  // The token may have been revoked or expired early, so retry once with a new one
  if (res.status === 401) {
    clearAccessToken();
    res = await fetchWithToken(url);
  }

  // Another client on the same account can still push us over the limit, so back off and retry
  for (let attempt = 0; res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES; attempt++) {
    await sleep(retryAfterMs(res));
    res = await fetchWithToken(url);
  }

  if (res.status === 404 && options.emptyOnNotFound) {
    return schema.parse([]);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch ${url.href}: ${res.status} ${res.statusText} ${body}`);
  }

  const result = await res.json();
  const parsed = schema.safeParse(result);

  if (!parsed.success) {
    throw new Error(`Failed to parse JSON from ${url.href}: ${parsed.error.message}`);
  }

  return parsed.data;
}