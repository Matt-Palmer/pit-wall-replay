import { z } from "zod";

const BASE_URL = "https://api.openf1.org/v1/";

export async function fetchJson<S extends z.ZodType>(path: string, params: Record<string, string | number>, schema: S): Promise<z.infer<S>> {
  const url = new URL(path, BASE_URL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url.href}: ${res.statusText}`);
  }

  const result = await res.json();
  const parsed = schema.safeParse(result);

  if (!parsed.success) {
    throw new Error(`Failed to parse JSON from ${url.href}: ${parsed.error.message}`);
  }

  return parsed.data;
}