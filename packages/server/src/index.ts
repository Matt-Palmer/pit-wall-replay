import express from "express";
import type { HealthResponse } from "@pitwall/shared";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/api/health", (_req: any, res: any) => {
  const response: HealthResponse = { status: "ok", time: new Date().toISOString() };
  res.json(response);
});

app.get("/api/greet", (_req: any, res: any) => {
  res.status(404).json({ error: "Name parameter is required" });
});

app.get("/api/greet/:name", (_req: any, res: any) => {
  res.json({ message: `Hello, ${_req.params.name}` });
});

app.post("/api/greet", (req: any, res: any) => {
  const { name } = req.body ?? {};

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  res.json({ message: `Hello, ${name}` });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});