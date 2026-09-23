import express from "express";
import { z } from "zod";
import type { HealthResponse } from "@pitwall/shared";
import { lapsSchema, sessionsSchema, driversSchema } from "@pitwall/shared";
import { cached } from "./lib/cache";
import { fetchJson } from "./lib/helpers";
import { sessionIdParamsSchema, yearParamsSchema } from "./lib/params";

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const app = express();
const port = 3000;

app.use(express.json());

app.get("/api/sessions/:year", async (req, res) => {
  const parsed = yearParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { year } = parsed.data;

  const sessions = await cached(`sessions:${year}`, CACHE_TTL, () => fetchJson('sessions', { year, session_name: 'Race' }, sessionsSchema));
  res.json(sessions);
});

app.get("/api/session/:id", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const session = await cached(`session:${id}`, CACHE_TTL, () => fetchJson("sessions", { session_key: id }, sessionsSchema));
  res.json(session);
});

app.get("/api/session/:id/drivers", async (req, res) => {
	const parsed = sessionIdParamsSchema.safeParse(req.params);
	if (!parsed.success) {
		res.status(400).json({ error: z.prettifyError(parsed.error) });
		return;
	}

	const { id } = parsed.data;

	const session = await cached(`session-drivers:${id}`, CACHE_TTL, () =>
		fetchJson("drivers", { session_key: id }, driversSchema),
	);
	res.json(session);
});

app.get("/api/session/:id/laps", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const laps = await cached(`laps:${id}`, CACHE_TTL, () => fetchJson("laps", { session_key: id }, lapsSchema));
  res.json(laps);
});

app.get("/api/health", (_req, res) => {
  const response: HealthResponse = { status: "ok", time: new Date().toISOString() };
  res.json(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});