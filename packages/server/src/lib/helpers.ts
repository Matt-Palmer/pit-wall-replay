import { z } from "zod";
import { clearAccessToken, getAccessToken } from "./auth";

const BASE_URL = "https://api.openf1.org/v1/";

async function fetchWithToken(url: URL) {
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