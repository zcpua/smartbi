import app from "../src/app.ts";

const port = parseInt(Bun.env.PORT || "3000");
Bun.serve({ fetch: app.fetch, port });
console.log(`SmartBI running on http://localhost:${port}`);
