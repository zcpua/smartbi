import { Hono } from "hono";
import { parseData } from "../parsers/index.js";
import { fetchData } from "../fetcher/index.js";
import { getRenderer } from "../renderers/index.js";
import { buildOption } from "../renderers/echarts.js";
import { svgToPng } from "../converter/png.js";
import { cacheHeaders } from "../cache/index.js";
import { validateQuery } from "../utils/validate.js";
import { THEMES } from "../config/themes.js";
import { renderEditor } from "../templates/editor.js";
import { renderShare } from "../templates/share.js";
import type { ChartConfig } from "../renderers/types.js";

const chart = new Hono();

async function resolveData(c: any): Promise<{ config: ChartConfig; rawCsv: string }> {
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

  const csvLines = [parsedData.headers.join(",")];
  for (const row of parsedData.rows) {
    csvLines.push(row.map((v) => String(v)).join(","));
  }

  return {
    config: {
      type: validated.type,
      data: parsedData,
      width: validated.width,
      height: validated.height,
      title: validated.title,
      xlabel: validated.xlabel,
      ylabel: validated.ylabel,
      colors,
      theme: validated.theme,
    },
    rawCsv: csvLines.join("\n"),
  };
}

async function handleChart(c: any, format: "svg" | "png") {
  const { config: chartConfig } = await resolveData(c);
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
  const { config: chartConfig } = await resolveData(c);

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

async function handleEditor(c: any) {
  if (process.env.ENABLE_EDITOR !== "true") {
    return c.json({ error: "Editor mode is not enabled" }, 403);
  }
  const { config, rawCsv } = await resolveData(c);
  const initialOption = buildOption(config);
  initialOption.tooltip = buildTooltip(config.type);

  const html = renderEditor({
    config,
    rawCsv,
    parsedData: { headers: config.data.headers, rows: config.data.rows, types: config.data.types },
    initialOption,
  });

  return c.html(html);
}

async function handleShare(c: any) {
  if (process.env.ENABLE_SHARE !== "true") {
    return c.json({ error: "Share mode is not enabled" }, 403);
  }
  const { config, rawCsv } = await resolveData(c);
  const option = buildOption(config);
  option.tooltip = buildTooltip(config.type);

  const html = renderShare({
    config,
    rawCsv,
    parsedData: { headers: config.data.headers, rows: config.data.rows, types: config.data.types },
    optionJson: JSON.stringify(option),
    enableEditor: process.env.ENABLE_EDITOR === "true",
  });

  return c.html(html);
}

function buildTooltip(type: string): Record<string, any> {
  switch (type) {
    case "pie":
    case "funnel":
    case "treemap":
    case "gauge":
      return { trigger: "item", formatter: "{b}: {c} ({d}%)" };
    case "scatter":
    case "radar":
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
chart.get("/editor.html", (c: any) => handleEditor(c));
chart.get("/share.html", (c: any) => handleShare(c));

chart.get("/chart", (c: any) => {
  const dest = (c.req.header("sec-fetch-dest") || "").toLowerCase();
  if (dest === "image") return handleChart(c, "svg");
  if (dest === "iframe") return handleHtml(c);
  if (dest === "document") {
    if (process.env.ENABLE_SHARE === "true") return handleShare(c);
    return handleHtml(c);
  }

  const accept = c.req.header("accept") || "";
  if (accept.includes("image/")) return handleChart(c, "svg");
  if (accept.includes("text/html")) {
    if (process.env.ENABLE_SHARE === "true") return handleShare(c);
    return handleHtml(c);
  }

  return handleChart(c, "svg");
});

export default chart;
