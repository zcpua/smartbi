# SmartBI

URL-based chart image service. Construct a URL, get back an SVG or PNG chart. Embed anywhere Markdown or HTML is supported.

```markdown
![Chart](https://your-domain.com/chart.svg?data=Month,Sales%0AJan,100%0AFeb,200%0AMar,300&type=line&title=Sales)
```

## Quick Start

```bash
npm install
npm run dev
# http://localhost:3000
```

## API

```
GET /chart        Smart route — auto-detects context (see below)
GET /chart.svg    Returns SVG image
GET /chart.png    Returns PNG image
GET /chart.html   Returns interactive HTML (ECharts client-side, with tooltip)
GET /share.html   Share page with chart preview + embed code bar
GET /editor.html  Full chart editor with controls, preview, and export
```

### Smart Route (`/chart`)

One URL, multiple behaviors — automatically adapts based on how it's used:

| Context | Header | Returns |
|---------|--------|---------|
| Browser address bar | `Sec-Fetch-Dest: document` | Share page |
| `<img src="...">` | `Sec-Fetch-Dest: image` | SVG image |
| `<iframe src="...">` | `Sec-Fetch-Dest: iframe` | Interactive HTML |
| curl / API | (none) | SVG image |

```html
<!-- Same URL, different results -->
<img src="https://domain.com/chart?data=...&type=line" />
<iframe src="https://domain.com/chart?data=...&type=line" width="800" height="400"></iframe>
<!-- Browser: opens share page with embed codes -->
```

### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data` | * | - | Inline CSV or Markdown table (URL encoded) |
| `source` | * | - | URL pointing to a CSV or Markdown table |
| `type` | No | `line` | Chart type (see below) |
| `renderer` | No | `auto` | `d3` or `echarts` |
| `title` | No | - | Chart title |
| `width` | No | `800` | Image width (100-2000) |
| `height` | No | `400` | Image height (100-2000) |
| `theme` | No | `light` | `light` or `dark` |
| `colors` | No | - | Comma-separated hex colors, e.g. `#ff6600,#3366cc` |
| `xlabel` | No | - | X-axis label |
| `ylabel` | No | - | Y-axis label |

> Either `data` or `source` is required. `data` takes inline text, `source` fetches from a remote URL.

### Chart Types

| Type | Renderer | Description |
|------|----------|-------------|
| `line` | D3 | Line chart |
| `bar` | D3 | Bar chart (grouped for multi-series) |
| `area` | D3 | Area chart |
| `scatter` | D3 | Scatter plot |
| `pie` | D3 | Pie / donut chart |
| `radar` | ECharts | Radar / spider chart |
| `heatmap` | ECharts | Heatmap matrix |
| `candlestick` | ECharts | Candlestick (OHLC) |
| `funnel` | ECharts | Funnel chart |
| `treemap` | ECharts | Treemap |
| `gauge` | ECharts | Gauge meter |

D3 is the default renderer for basic types (lighter, faster SVG output). ECharts handles complex types via SSR. Override with `&renderer=echarts` to force ECharts for any type.

## Data Formats

### Inline CSV

```
/chart.svg?data=Month,Revenue,Cost%0AJan,12000,8000%0AFeb,15000,9000%0AMar,18000,10000&type=bar
```

### Inline Markdown Table

```
/chart.svg?data=%7C+Month+%7C+Sales+%7C%0A%7C-------%7C-------%7C%0A%7C+Q1+%7C+120+%7C%0A%7C+Q2+%7C+150+%7C&type=line
```

### Remote URL (CSV or Markdown)

```
/chart.svg?source=https://raw.githubusercontent.com/user/repo/main/data.csv&type=line
```

The parser auto-detects CSV vs Markdown table format.

## Interactive HTML Mode

`/chart.html` returns a self-contained HTML page with ECharts client-side rendering. Supports tooltip on hover, legend interaction, and auto-resize. Perfect for embedding via iframe.

**URL format** - same parameters as `/chart.svg`, just change the extension:

```
/chart.html?data=Month,Sales,Profit%0AJan,100,60%0AFeb,200,120%0AMar,300,180&type=line&title=Revenue&theme=dark
```

**Embed via iframe:**

```html
<iframe
  src="https://your-domain.com/chart.html?data=Month,Sales%0AJan,100%0AFeb,200%0AMar,300&type=line&title=Traffic"
  width="800" height="400" frameborder="0">
</iframe>
```

Features:
- Tooltip with crosshair on hover (axis-type for cartesian charts, item-type for pie/funnel/radar)
- Auto-resize to fit iframe container
- All 11 chart types supported
- Light and dark themes

## Share Page

`/share.html` displays the chart full-screen with a compact bottom bar for sharing embed codes.

```
/share.html?data=Month,Sales,Profit%0AJan,100,60%0AFeb,200,120%0AMar,300,180&type=line&title=Revenue
```

**Bottom bar tabs:**
- **Link** — Smart URL (`/chart?...`)
- **Markdown** — `![Chart](url)` embed syntax
- **HTML** — `<img src="url" />` tag
- **iframe** — `<iframe src="url" ...></iframe>` embed

Each tab shows the code in a monospace box with a **Copy** button. An **Edit** button navigates to the full editor (`/editor.html`) with the same parameters.

This is the default page when opening `/chart` in a browser.

## Chart Editor

`/editor.html` provides a full visual editor for designing charts interactively.

```
/editor.html?data=Month,Sales,Profit%0AJan,100,60%0AFeb,200,120%0AMar,300,180&type=line&title=Revenue
```

**Editor features:**
- Switch between all 11 chart types with icon buttons, real-time preview
- 6 preset color schemes (Default, Warm, Cool, Pastel, Vivid, Monochrome) + custom hex colors
- Light / Dark theme toggle
- Edit title, axis labels, dimensions, smooth curves
- Export panel with one-click copy for 6 formats:
  - SVG URL, PNG URL, Markdown embed, HTML `<img>` tag, `<iframe>` embed, raw CSV
- Direct download as SVG or PNG

## Examples

**Line chart, dark theme:**

```markdown
![](https://your-domain.com/chart.svg?data=Month,UV,PV%0AJan,8200,32000%0AFeb,9500,38000%0AMar,11000,45000%0AApr,10200,41000%0AMay,13500,52000%0AJun,15000,58000&type=line&title=Site%20Traffic&theme=dark)
```

**Bar chart with custom colors:**

```markdown
![](https://your-domain.com/chart.svg?data=Team,Score%0AAlpha,92%0ABeta,85%0AGamma,78&type=bar&colors=%2300b894,%236c5ce7,%23e17055)
```

**Radar chart (ECharts):**

```markdown
![](https://your-domain.com/chart.svg?data=Name,ATK,DEF,SPD,HP,MP%0AWarrior,90,80,60,100,30%0AMage,40,30,50,60,95&type=radar&title=Character%20Stats)
```

**Funnel chart, dark theme:**

```markdown
![](https://your-domain.com/chart.svg?data=Stage,Users%0AVisit,10000%0ASignup,5000%0AActivate,3000%0APaid,1500&type=funnel&theme=dark)
```

## Architecture

```
src/
├── app.ts                 Pure Hono app (platform-agnostic entry)
├── index.ts               Node.js dev server (localhost + fixture serving)
├── routes/chart.ts        GET /chart.svg, /chart.png, /chart.html, /editor.html
├── parsers/               CSV (PapaParse) + Markdown table parser
├── renderers/
│   ├── types.ts           ChartConfig, ChartRenderer interface
│   ├── d3.ts              D3 + linkedom (line/bar/pie/area/scatter)
│   ├── echarts.ts         ECharts SSR (radar/heatmap/funnel/...)
│   └── index.ts           Renderer factory
├── converter/png.ts       SVG -> PNG via resvg-wasm
├── fetcher/               Remote URL fetcher (timeout, size limit, SSRF protection)
├── cache/                 HTTP cache headers
├── config/                Themes (light/dark), defaults
├── utils/validate.ts      Query parameter validation
└── errors/                Typed error classes
api/index.ts               Vercel Edge entry point
bun/serve.ts               Bun entry point
deno/serve.ts              Deno Deploy entry point
```

**Dual renderer engine:**
- **D3 + linkedom** for basic chart types - pure SVG string generation, small output, fast
- **ECharts SSR** for complex chart types - built-in layout algorithms, rendered server-side to SVG

Both renderers work in Edge runtime (no native Node.js modules required).

## Deployment

SmartBI runs on any edge runtime. The core app (`src/app.ts`) is platform-agnostic — each platform has its own thin entry point.

```
src/app.ts        <- Pure Hono app (shared by all platforms)
src/index.ts      <- Node.js dev server (localhost)
api/index.ts      <- Vercel Edge entry
bun/serve.ts      <- Bun entry
wrangler.toml     <- Cloudflare Workers config
deno/serve.ts     <- Deno Deploy entry
```

### Cloudflare Workers

1. Install [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

```bash
npm install -g wrangler
```

2. Login to Cloudflare:

```bash
wrangler login
```

3. Deploy:

```bash
npx wrangler deploy
```

The `wrangler.toml` config points to `src/app.ts` as the entry. Workers use the default export of the Hono app directly.

To preview before deploying:

```bash
npx wrangler dev
```

### Vercel

1. Install [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm install -g vercel
```

2. Deploy:

```bash
vercel deploy
```

On first run, Vercel CLI will prompt you to link or create a project. The `vercel.json` rewrites all requests to the `api/index.ts` Edge Function entry point.

For production deployment:

```bash
vercel deploy --prod
```

You can also connect your GitHub repo in the [Vercel Dashboard](https://vercel.com/dashboard) for automatic deployments on push.

### Deno Deploy

#### Option A: CLI deploy

1. Install [deployctl](https://docs.deno.com/deploy/manual/deployctl):

```bash
deno install -gArf jsr:@deno/deployctl
```

2. Deploy:

```bash
deployctl deploy --project=smartbi --entrypoint=deno/serve.ts
```

Or, if you have `deno.json` configured:

```bash
deno task deploy
```

#### Option B: GitHub integration (recommended for production)

1. Go to [Deno Deploy Dashboard](https://dash.deno.com) and create a new project
2. Connect your GitHub repository
3. Set the entrypoint to `deno/serve.ts`
4. Every push to `main` will auto-deploy

#### Local development with Deno

```bash
deno task start
```

### Environment Notes

- **SSRF protection**: In production (`NODE_ENV=production`), requests to private/local IPs (127.x, 10.x, 172.16-31.x, 192.168.x) via `?source=` are blocked
- **Dev mode**: When `NODE_ENV` is not `production`, localhost URLs are allowed for testing with `?source=`
- **PNG support**: SVG-to-PNG conversion via `resvg-wasm` — works on all platforms that support WebAssembly

### Docker

Three Dockerfiles are provided for Node.js, Bun, and Deno runtimes:

**Node.js** (default):

```bash
docker build -t smartbi .
docker run -p 3000:3000 smartbi
```

**Bun**:

```bash
docker build -f Dockerfile.bun -t smartbi-bun .
docker run -p 3000:3000 smartbi-bun
```

**Deno**:

```bash
docker build -f Dockerfile.deno -t smartbi-deno .
docker run -p 8000:8000 smartbi-deno
```

| Runtime | Dockerfile | Port | Entry point |
|---------|-----------|------|-------------|
| Node.js | `Dockerfile` | 3000 | `src/index.ts` |
| Bun | `Dockerfile.bun` | 3000 | `bun/serve.ts` |
| Deno | `Dockerfile.deno` | 8000 | `deno/serve.ts` |

### CI/CD (GitHub Actions)

Two workflows are included in `.github/workflows/`:

**`deploy.yml`** — Push to `main` auto-deploys to all three platforms:

| Platform | Runs on | Required Secrets |
|----------|---------|-----------------|
| Cloudflare Workers | `push: main` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| Vercel | `push: main` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| Deno Deploy | `push: main` | (uses GitHub OIDC — link repo in [Deno Deploy Dashboard](https://dash.deno.com)) |

**`docker.yml`** — Push a version tag to build & publish Docker images:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Publishes to `ghcr.io` (GitHub Container Registry):

| Tag | Image |
|-----|-------|
| `latest` / `v1.0.0` | Node.js (default) |
| `bun` / `v1.0.0-bun` | Bun |
| `deno` / `v1.0.0-deno` | Deno |

```bash
docker pull ghcr.io/zcpua/smartbi:latest       # Node.js
docker pull ghcr.io/zcpua/smartbi:bun           # Bun
docker pull ghcr.io/zcpua/smartbi:deno           # Deno
```

#### Setting up secrets

1. **Cloudflare**: [Create API Token](https://dash.cloudflare.com/profile/api-tokens) with `Workers` permission → add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to repo secrets
2. **Vercel**: Run `vercel link` locally, then copy values from `.vercel/project.json` → add `VERCEL_TOKEN` (from [Vercel Tokens](https://vercel.com/account/tokens)), `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
3. **Deno Deploy**: Link your GitHub repo in [Deno Deploy Dashboard](https://dash.deno.com) — the workflow uses GitHub OIDC, no token needed

Both workflows also support `workflow_dispatch` for manual triggers from the Actions tab.

## Development

```bash
npm run dev          # Start with hot reload (tsx --watch)
```

Test locally:

```bash
# SVG output
curl "http://localhost:3000/chart.svg?data=Month,Sales%0AJan,100%0AFeb,200&type=line" -o chart.svg

# PNG output
curl "http://localhost:3000/chart.png?data=Month,Sales%0AJan,100%0AFeb,200&type=bar&theme=dark" -o chart.png

# Remote data source
curl "http://localhost:3000/chart.svg?source=http://localhost:3000/fixtures/demo.csv&type=line&renderer=echarts" -o chart.svg

# Interactive HTML (open in browser)
open "http://localhost:3000/chart.html?data=Month,Sales,Profit%0AJan,100,60%0AFeb,200,120%0AMar,300,180&type=line&title=Revenue&theme=dark"
```

## Tech Stack

- **[Hono](https://hono.dev)** - Edge-first HTTP framework
- **[D3](https://d3js.org)** (selective imports) + **[linkedom](https://github.com/WebReflection/linkedom)** - SVG chart rendering
- **[ECharts](https://echarts.apache.org)** (SSR mode) - Complex chart rendering
- **[@resvg/resvg-wasm](https://github.com/nicolo-ribaudo/resvg-js)** - SVG to PNG conversion
- **[PapaParse](https://www.papaparse.com)** - CSV parsing

## License

Apache-2.0
