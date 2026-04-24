import { Hono } from "hono";
import { cors } from "hono/cors";
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

export default app;
