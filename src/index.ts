import { serve } from "@hono/node-server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import app from "./app.js";

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
