import express from "express";
import { z } from "zod";
import type { HealthResponse, SessionLocations } from "@pitwall/shared";
import { lapsSchema, sessionsSchema, driversSchema, positionsSchema, intervalsSchema, stintsSchema, sessionResultsSchema, meetingsSchema, locationsSchema } from "@pitwall/shared";
import { cached } from "./lib/cache";
import { fetchJson } from "./lib/helpers";
import { downsample, fastestLapTrack, mapWithConcurrency } from "./lib/locations";
import { sessionIdParamsSchema, yearParamsSchema } from "./lib/params";

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
// Results are empty until a session is classified, so check again soon
const EMPTY_RESULT_TTL = 1000 * 60; // 1 minute
// Car positions are sent at about 1 Hz, matching the scrubber step; the client interpolates between them
const LOCATION_SAMPLE_MS = 1000;
const LOCATION_FETCH_CONCURRENCY = 4;

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

app.get("/api/meeting/:id", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const meeting = await cached(`meeting:${id}`, CACHE_TTL, () => fetchJson("meetings", { meeting_key: id }, meetingsSchema));
  res.json(meeting);
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

// Shared by their own routes and the locations route
const loadDrivers = (id: number) =>
	cached(`session-drivers:${id}`, CACHE_TTL, () => fetchJson("drivers", { session_key: id }, driversSchema));

const loadLaps = (id: number) =>
	cached(`laps:${id}`, CACHE_TTL, () => fetchJson("laps", { session_key: id }, lapsSchema));

app.get("/api/session/:id/drivers", async (req, res) => {
	const parsed = sessionIdParamsSchema.safeParse(req.params);
	if (!parsed.success) {
		res.status(400).json({ error: z.prettifyError(parsed.error) });
		return;
	}

	const { id } = parsed.data;

	const session = await loadDrivers(id);
	res.json(session);
});

app.get("/api/session/:id/laps", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const laps = await loadLaps(id);
  res.json(laps);
});

app.get("/api/session/:id/locations", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const locations = await cached(`locations:${id}`, CACHE_TTL, async (): Promise<SessionLocations> => {
    const [drivers, laps] = await Promise.all([loadDrivers(id), loadLaps(id)]);

    // A whole session in one request is too large for OpenF1, so fetch a driver at a time
    const rows = await mapWithConcurrency(drivers, LOCATION_FETCH_CONCURRENCY, (driver) =>
      fetchJson("location", { session_key: id, driver_number: driver.driver_number }, locationsSchema, { emptyOnNotFound: true }),
    );
    const rowsByDriver = new Map(drivers.map((driver, i) => [driver.driver_number, rows[i] ?? []]));

    const cars: SessionLocations["cars"] = {};
    for (const [driverNumber, driverRows] of rowsByDriver) {
      if (driverRows.length) cars[driverNumber] = downsample(driverRows, LOCATION_SAMPLE_MS);
    }

    return { track: fastestLapTrack(laps, rowsByDriver), cars };
  });
  res.json(locations);
});

app.get("/api/session/:id/positions", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const positions = await cached(`position:${id}`, CACHE_TTL, () => fetchJson("position", { session_key: id }, positionsSchema));
  res.json(positions);
});

app.get("/api/session/:id/intervals", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const intervals = await cached(`intervals:${id}`, CACHE_TTL, () => fetchJson("intervals", { session_key: id }, intervalsSchema));
  res.json(intervals);
});

app.get("/api/session/:id/stints", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const stints = await cached(`stints:${id}`, CACHE_TTL, () => fetchJson("stints", { session_key: id }, stintsSchema));
  res.json(stints);
});

app.get("/api/session/:id/result", async (req, res) => {
  const parsed = sessionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;

  const results = await cached(
    `session-result:${id}`,
    (value) => (value.length ? CACHE_TTL : EMPTY_RESULT_TTL),
    () => fetchJson("session_result", { session_key: id }, sessionResultsSchema, { emptyOnNotFound: true }),
  );
  res.json(results);
});

app.get("/api/health", (_req, res) => {
  const response: HealthResponse = { status: "ok", time: new Date().toISOString() };
  res.json(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});