import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SmartBIError } from "./errors/index.js";
import chart from "./routes/chart.js";

const app = new Hono();

app.use("*", cors());

app.onError((err, c) => {
  if (err instanceof SmartBIError) {
    return c.json({ error: err.message }, err.status as any);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/", (c) =>
  c.json({ name: "SmartBI", version: "0.1.0", status: "ok" }),
);

app.route("/", chart);

app.get("/fixtures/:file", (c) => {
  const file = c.req.param("file");
  try {
    const content = readFileSync(join(process.cwd(), "test/fixtures", file), "utf-8");
    const ct = file.endsWith(".csv") ? "text/csv" : "text/plain";
    return c.body(content, 200, { "Content-Type": ct });
  } catch {
    return c.json({ error: "File not found" }, 404);
  }
});

export default app;

const port = parseInt(process.env.PORT || "3000", 10);
serve({ fetch: app.fetch, port }, () => {
  console.log(`SmartBI running on http://localhost:${port}`);
});
