import express from "express";
import type { HealthResponse } from "@pitwall/shared";

const app = express();
const port = 3000;

app.get("/api/health", (_req: any, res: any) => {
  const response: HealthResponse = { status: "ok", time: new Date().toISOString() };
  res.json(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});