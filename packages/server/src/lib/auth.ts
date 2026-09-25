import { z } from "zod";

const TOKEN_URL = "https://api.openf1.org/token";
// Refresh a little before the token actually expires
const EXPIRY_MARGIN_MS = 1000 * 60 * 5; // 5 minutes

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.coerce.number(),
});

let token: { value: string; expires: number } | undefined;
let inflight: Promise<string> | undefined;

async function requestToken(): Promise<string> {
  const username = process.env.OPENF1_USERNAME;
  const password = process.env.OPENF1_PASSWORD;

  if (!username || !password) {
    throw new Error("OPENF1_USERNAME and OPENF1_PASSWORD must be set in packages/server/.env");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to get OpenF1 token: ${res.status} ${res.statusText} ${body}`);
  }

  const parsed = tokenResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error(`Invalid OpenF1 token response: ${parsed.error.message}`);
  }

  const { access_token, expires_in } = parsed.data;
  token = { value: access_token, expires: Date.now() + expires_in * 1000 - EXPIRY_MARGIN_MS };
  return access_token;
}

export async function getAccessToken(): Promise<string> {
  if (token && Date.now() < token.expires) return token.value;

  // Share one token request between concurrent callers
  inflight ??= requestToken().finally(() => {
    inflight = undefined;
  });
  return inflight;
}

export function clearAccessToken() {
  token = undefined;
}
