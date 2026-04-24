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
GET /chart.svg   Returns SVG image
GET /chart.png   Returns PNG image
GET /chart.html  Returns interactive HTML (ECharts client-side, with tooltip)
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
├── index.ts               Hono app entry + Node.js server
├── routes/chart.ts        GET /chart.svg, /chart.png, /chart.html
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
```

**Dual renderer engine:**
- **D3 + linkedom** for basic chart types - pure SVG string generation, small output, fast
- **ECharts SSR** for complex chart types - built-in layout algorithms, rendered server-side to SVG

Both renderers work in Edge runtime (no native Node.js modules required).

## Deployment

### Cloudflare Workers

```bash
npx wrangler deploy
```

### Vercel Edge

```bash
vercel deploy
```

The `api/index.ts` entry point adapts the Hono app for Vercel Edge Functions.

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

MIT
