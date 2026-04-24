import { Hono } from "hono";
import { parseData } from "../parsers/index.js";
import { fetchData } from "../fetcher/index.js";
import { getRenderer } from "../renderers/index.js";
import { buildOption } from "../renderers/echarts.js";
import { svgToPng } from "../converter/png.js";
import { cacheHeaders } from "../cache/index.js";
import { validateQuery } from "../utils/validate.js";
import { THEMES } from "../config/themes.js";
import type { ChartConfig } from "../renderers/types.js";

const chart = new Hono();

async function resolveConfig(c: any): Promise<ChartConfig> {
  const query = c.req.query();
  const validated = validateQuery(query);

  let rawData: string;
  if (validated.source) {
    rawData = await fetchData(validated.source);
  } else {
    rawData = validated.data!;
  }

  const parsedData = parseData(rawData);
  const theme = THEMES[validated.theme];
  const colors = validated.colors.length > 0 ? validated.colors : theme.colors;

  return {
    type: validated.type,
    data: parsedData,
    width: validated.width,
    height: validated.height,
    title: validated.title,
    xlabel: validated.xlabel,
    ylabel: validated.ylabel,
    colors,
    theme: validated.theme,
  };
}

async function handleChart(c: any, format: "svg" | "png") {
  const chartConfig = await resolveConfig(c);
  const validated = validateQuery(c.req.query());
  const renderer = getRenderer(chartConfig.type, validated.renderer);
  const svg = await renderer.render(chartConfig);

  if (format === "png") {
    const png = await svgToPng(svg, chartConfig.width);
    return c.body(png, 200, {
      "Content-Type": "image/png",
      ...cacheHeaders(),
    });
  }

  return c.body(svg, 200, {
    "Content-Type": "image/svg+xml",
    ...cacheHeaders(),
  });
}

async function handleHtml(c: any) {
  const chartConfig = await resolveConfig(c);

  const option = buildOption(chartConfig);
  option.tooltip = buildTooltip(chartConfig.type);

  const theme = THEMES[chartConfig.theme];
  const optionJson = JSON.stringify(option);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(chartConfig.title || "SmartBI Chart")}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:${theme.background}}
#chart{width:100%;height:100%}
</style>
</head>
<body>
<div id="chart"></div>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
<script>
(function(){
  var dom=document.getElementById('chart');
  var chart=echarts.init(dom,${chartConfig.theme === "dark" ? "'dark'" : "null"});
  var option=${optionJson};
  chart.setOption(option);
  window.addEventListener('resize',function(){chart.resize()});
})();
<\/script>
</body>
</html>`;

  return c.html(html, 200, cacheHeaders());
}

function buildTooltip(type: string): Record<string, any> {
  switch (type) {
    case "pie":
    case "funnel":
    case "treemap":
    case "gauge":
      return { trigger: "item", formatter: "{b}: {c} ({d}%)" };
    case "scatter":
      return { trigger: "item" };
    case "radar":
      return { trigger: "item" };
    case "heatmap":
      return { trigger: "item" };
    default:
      return { trigger: "axis", axisPointer: { type: "cross", crossStyle: { color: "#999" } } };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

chart.get("/chart.svg", (c: any) => handleChart(c, "svg"));
chart.get("/chart.png", (c: any) => handleChart(c, "png"));
chart.get("/chart.html", (c: any) => handleHtml(c));

export default chart;
