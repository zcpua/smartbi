# SmartBI

URL-based chart image service. Takes CSV/Markdown data, returns SVG/PNG chart images or interactive HTML.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000) with hot reload
npm test             # Run tests
npx wrangler deploy  # Deploy to Cloudflare Workers
vercel deploy        # Deploy to Vercel Edge
bun run bun/serve.ts # Start dev server with Bun
deno task start      # Start dev server with Deno
deno task deploy     # Deploy to Deno Deploy
docker build -t smartbi .              # Build Docker image (Node.js)
docker build -f Dockerfile.bun -t smartbi-bun .   # Build Docker image (Bun)
docker build -f Dockerfile.deno -t smartbi-deno .  # Build Docker image (Deno)
```

## Architecture

Hono HTTP framework, dual chart renderer:

- **D3 + linkedom** (`src/renderers/d3.ts`): line, bar, pie, area, scatter - pure SVG string output
- **ECharts SSR** (`src/renderers/echarts.ts`): radar, heatmap, candlestick, funnel, treemap, gauge
- Renderer factory (`src/renderers/index.ts`) auto-selects engine by chart type, overridable via `&renderer=` param

Request flow: `routes/chart.ts` validates params -> fetches/parses data -> selects renderer -> returns SVG/PNG/HTML.

### Smart route (`/chart`)

Single URL that auto-detects context via `Sec-Fetch-Dest` header: `image` → SVG, `iframe` → interactive HTML, `document` → share page. Falls back to `Accept` header, then defaults to SVG.

### Share page (`/share.html`)

Chart fills the viewport, compact 44px bottom bar with Link/Markdown/HTML/iframe tabs, code display box, Copy button, and Edit button linking to `/editor.html`. Template in `src/templates/share.ts`.

### Editor mode (`/editor.html`)

Full visual chart editor. Server injects parsed data + initial ECharts option into `src/templates/editor.ts` template. Client-side JS handles: chart type switching, 6 color scheme presets + custom colors, light/dark theme toggle, parameter editing (title, labels, dimensions, smooth), and export panel (SVG URL, PNG URL, Markdown, HTML img, iframe, CSV) with copy/download. All state managed in a global `S` object, `buildOpt()` rebuilds ECharts option on every change.

## Key Files

```
src/
├── app.ts                    Pure Hono app (platform-agnostic, shared by all deploy targets)
├── index.ts                  Node.js dev server, serves on @hono/node-server locally
├── routes/chart.ts           Routes: GET /chart (smart), /chart.svg, /chart.png, /chart.html, /share.html, /editor.html
├── parsers/
│   ├── csv.ts                PapaParse wrapper, outputs ParsedData
│   ├── markdown.ts           GFM table parser, outputs ParsedData
│   └── index.ts              Auto-detect format dispatcher
├── renderers/
│   ├── types.ts              Core types: ParsedData, ChartConfig, ChartRenderer interface
│   ├── d3.ts                 D3 renderer (5 chart types)
│   ├── echarts.ts            ECharts SSR renderer (11 chart types), exports buildOption() for HTML mode
│   └── index.ts              getRenderer() factory
├── templates/
│   ├── editor.ts             Self-contained HTML editor template (chart type/color/theme/param editing + export)
│   └── share.ts              Share page template (full-screen chart + bottom embed bar)
├── converter/png.ts          SVG -> PNG via @resvg/resvg-wasm
├── fetcher/index.ts          Remote URL fetcher (SSRF protection in prod, relaxed in dev)
├── cache/index.ts            Cache-Control header helper
├── config/
│   ├── defaults.ts           Default dimensions, chart types, renderer mapping sets
│   └── themes.ts             Light/dark color palettes
├── utils/validate.ts         Query parameter validation -> ValidatedQuery
└── errors/index.ts           SmartBIError, ValidationError, ParseError, DataFetchError, RenderError
api/index.ts                  Vercel Edge entry point (re-exports Hono app via hono/vercel)
bun/serve.ts                  Bun entry point (Bun.serve + Hono app)
deno/serve.ts                 Deno Deploy entry point (Deno.serve + Hono app)
test/fixtures/                Sample CSV and Markdown data files for local testing
```

## Types

All parsers produce `ParsedData { headers, rows, types }`. All renderers consume `ChartConfig` and implement `ChartRenderer.render() -> Promise<string>` (SVG string).

Chart types: `line | bar | pie | area | scatter | radar | heatmap | candlestick | funnel | treemap | gauge`.

## Data Flow

1. `validateQuery()` validates and normalizes all URL params
2. Data from `?data=` (inline) or `?source=` (remote URL via `fetchData()`)
3. `parseData()` auto-detects CSV vs Markdown, returns `ParsedData`
4. `getRenderer()` picks D3 or ECharts based on chart type + user preference
5. Renderer produces SVG string
6. For `/chart.png`: `svgToPng()` converts via resvg-wasm
7. For `/chart.html`: `buildOption()` generates ECharts option JSON, injected into HTML template with CDN ECharts + tooltip config
8. Response with appropriate Content-Type and Cache-Control headers

## Conventions

- Edge-runtime compatible: no `fs`, `node-canvas`, or native modules in rendering path
- D3 imported selectively (`d3-array`, `d3-scale`, etc.) not as full `d3` package
- ECharts uses `echarts/core` with manual component registration for tree-shaking
- SSRF protection blocks private IPs in production (`NODE_ENV=production`)
- Dev mode (`NODE_ENV !== production`) allows localhost URLs for testing
- Errors are typed (`SmartBIError` subclasses) with HTTP status codes, caught by Hono `onError`

## Testing

Dev server serves fixture files at `/fixtures/:file` for local `?source=` testing:
- `test/fixtures/demo.csv` - 12-month traffic data (UV, PV, Bounce Rate)
- `test/fixtures/demo.md` - Same data as Markdown table
