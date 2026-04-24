import * as echarts from "echarts/core";
import { LineChart, BarChart, PieChart, ScatterChart, RadarChart, HeatmapChart, CandlestickChart, FunnelChart, TreemapChart, GaugeChart } from "echarts/charts";
import { GridComponent, TitleComponent, LegendComponent, DatasetComponent, TooltipComponent, RadarComponent, VisualMapComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { THEMES } from "../config/themes.js";
import type { ChartConfig, ChartRenderer, ChartType, ParsedData } from "./types.js";

echarts.use([
  LineChart, BarChart, PieChart, ScatterChart, RadarChart,
  HeatmapChart, CandlestickChart, FunnelChart, TreemapChart, GaugeChart,
  GridComponent, TitleComponent, LegendComponent, DatasetComponent,
  TooltipComponent, RadarComponent, VisualMapComponent,
  SVGRenderer,
]);

export class EChartsRenderer implements ChartRenderer {
  readonly supportedTypes: ChartType[] = [
    "line", "bar", "pie", "area", "scatter",
    "radar", "heatmap", "candlestick", "funnel", "treemap", "gauge",
  ];

  async render(config: ChartConfig): Promise<string> {
    const chart = echarts.init(null, config.theme === "dark" ? "dark" : undefined, {
      renderer: "svg",
      ssr: true,
      width: config.width,
      height: config.height,
    });

    const option = buildOption(config);
    chart.setOption(option);
    const svgStr = (chart as any).renderToSVGString();
    chart.dispose();

    return svgStr;
  }
}

export function buildOption(config: ChartConfig): echarts.EChartsOption {
  const theme = THEMES[config.theme];
  const colors = config.colors.length > 0 ? config.colors : theme.colors;

  const base: echarts.EChartsOption = {
    backgroundColor: theme.background,
    color: colors,
    title: config.title ? { text: config.title, left: "center", textStyle: { color: theme.text, fontSize: 16 } } : undefined,
    textStyle: { fontFamily: "Arial, Helvetica, sans-serif", color: theme.subtext },
  };

  switch (config.type) {
    case "line":
    case "area":
      return { ...base, ...buildCartesian(config, config.type === "area" ? "line" : "line", config.type === "area") };
    case "bar":
      return { ...base, ...buildCartesian(config, "bar", false) };
    case "scatter":
      return { ...base, ...buildScatter(config) };
    case "pie":
      return { ...base, ...buildPie(config) };
    case "radar":
      return { ...base, ...buildRadar(config) };
    case "heatmap":
      return { ...base, ...buildHeatmap(config) };
    case "candlestick":
      return { ...base, ...buildCandlestick(config) };
    case "funnel":
      return { ...base, ...buildFunnel(config) };
    case "treemap":
      return { ...base, ...buildTreemap(config) };
    case "gauge":
      return { ...base, ...buildGauge(config) };
    default:
      return { ...base, ...buildCartesian(config, "line", false) };
  }
}

function getSeriesInfo(data: ParsedData) {
  const labelIdx = data.types.findIndex((t) => t === "string");
  const numericIndices = data.types.map((t, i) => (t === "number" ? i : -1)).filter((i) => i >= 0);
  const labels = labelIdx >= 0 ? data.rows.map((r) => String(r[labelIdx])) : data.rows.map((_, i) => String(i));
  return { labelIdx, numericIndices, labels };
}

function buildCartesian(config: ChartConfig, seriesType: string, isArea: boolean): echarts.EChartsOption {
  const { labelIdx, numericIndices, labels } = getSeriesInfo(config.data);
  const theme = THEMES[config.theme];

  return {
    grid: { left: 60, right: 30, top: config.title ? 50 : 30, bottom: 50, containLabel: false },
    xAxis: {
      type: "category",
      data: labels,
      name: config.xlabel,
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.subtext },
    },
    yAxis: {
      type: "value",
      name: config.ylabel,
      splitLine: { lineStyle: { color: theme.grid, type: "dashed" } },
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.subtext },
    },
    legend: numericIndices.length > 1 ? { data: numericIndices.map((i) => config.data.headers[i]), top: config.title ? 30 : 5, textStyle: { color: theme.subtext } } : undefined,
    series: numericIndices.map((ni) => ({
      name: config.data.headers[ni],
      type: seriesType,
      data: config.data.rows.map((r) => r[ni]),
      smooth: true,
      ...(isArea ? { areaStyle: { opacity: 0.3 } } : {}),
    })),
  };
}

function buildScatter(config: ChartConfig): echarts.EChartsOption {
  const numericCols = config.data.types.map((t, i) => (t === "number" ? i : -1)).filter((i) => i >= 0);
  const xIdx = numericCols[0] ?? 0;
  const yIdx = numericCols[1] ?? numericCols[0] ?? 0;
  const theme = THEMES[config.theme];

  return {
    grid: { left: 60, right: 30, top: config.title ? 50 : 30, bottom: 50 },
    xAxis: { type: "value", name: config.xlabel || config.data.headers[xIdx], splitLine: { lineStyle: { color: theme.grid, type: "dashed" } }, axisLabel: { color: theme.subtext } },
    yAxis: { type: "value", name: config.ylabel || config.data.headers[yIdx], splitLine: { lineStyle: { color: theme.grid, type: "dashed" } }, axisLabel: { color: theme.subtext } },
    series: [{ type: "scatter", data: config.data.rows.map((r) => [r[xIdx], r[yIdx]]), symbolSize: 8 }],
  };
}

function buildPie(config: ChartConfig): echarts.EChartsOption {
  const labelIdx = config.data.types.findIndex((t) => t === "string");
  const valueIdx = config.data.types.findIndex((t) => t === "number");
  const theme = THEMES[config.theme];

  return {
    legend: { bottom: 10, textStyle: { color: theme.subtext } },
    series: [{
      type: "pie",
      radius: ["30%", "65%"],
      center: ["50%", "45%"],
      data: config.data.rows.map((r) => ({
        name: labelIdx >= 0 ? String(r[labelIdx]) : "",
        value: valueIdx >= 0 ? Number(r[valueIdx]) : 0,
      })),
      label: { color: theme.subtext },
    }],
  };
}

function buildRadar(config: ChartConfig): echarts.EChartsOption {
  const { numericIndices, labels } = getSeriesInfo(config.data);
  const theme = THEMES[config.theme];

  const indicators = numericIndices.map((ni) => {
    const vals = config.data.rows.map((r) => Number(r[ni]) || 0);
    return { name: config.data.headers[ni], max: Math.max(...vals) * 1.2 || 100 };
  });

  return {
    legend: { bottom: 10, textStyle: { color: theme.subtext } },
    radar: { indicator: indicators, shape: "polygon", axisName: { color: theme.subtext }, splitLine: { lineStyle: { color: theme.grid } }, splitArea: { areaStyle: { color: ["transparent"] } } },
    series: [{
      type: "radar",
      data: config.data.rows.map((r, i) => ({
        name: labels[i],
        value: numericIndices.map((ni) => Number(r[ni]) || 0),
      })),
    }],
  };
}

function buildHeatmap(config: ChartConfig): echarts.EChartsOption {
  const { numericIndices, labels } = getSeriesInfo(config.data);
  const theme = THEMES[config.theme];
  const colors = config.colors.length > 0 ? config.colors : theme.colors;

  const yLabels = numericIndices.map((i) => config.data.headers[i]);
  const heatData: [number, number, number][] = [];
  let maxVal = 0;

  config.data.rows.forEach((r, ri) => {
    numericIndices.forEach((ni, ci) => {
      const val = Number(r[ni]) || 0;
      heatData.push([ri, ci, val]);
      if (val > maxVal) maxVal = val;
    });
  });

  return {
    grid: { left: 80, right: 40, top: config.title ? 50 : 30, bottom: 50 },
    xAxis: { type: "category", data: labels, axisLabel: { color: theme.subtext }, splitArea: { show: true } },
    yAxis: { type: "category", data: yLabels, axisLabel: { color: theme.subtext }, splitArea: { show: true } },
    visualMap: { min: 0, max: maxVal || 100, calculable: true, orient: "horizontal", left: "center", bottom: 5, inRange: { color: [colors[0], colors[1] || "#ee6666"] }, textStyle: { color: theme.subtext } },
    series: [{ type: "heatmap", data: heatData, label: { show: true, color: theme.text } }],
  };
}

function buildCandlestick(config: ChartConfig): echarts.EChartsOption {
  const { labels } = getSeriesInfo(config.data);
  const numericCols = config.data.types.map((t, i) => (t === "number" ? i : -1)).filter((i) => i >= 0);
  const theme = THEMES[config.theme];

  return {
    grid: { left: 60, right: 30, top: config.title ? 50 : 30, bottom: 50 },
    xAxis: { type: "category", data: labels, axisLabel: { color: theme.subtext } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: theme.grid, type: "dashed" } }, axisLabel: { color: theme.subtext } },
    series: [{
      type: "candlestick",
      data: config.data.rows.map((r) => numericCols.slice(0, 4).map((ni) => Number(r[ni]) || 0)),
    }],
  };
}

function buildFunnel(config: ChartConfig): echarts.EChartsOption {
  const labelIdx = config.data.types.findIndex((t) => t === "string");
  const valueIdx = config.data.types.findIndex((t) => t === "number");
  const theme = THEMES[config.theme];

  return {
    legend: { bottom: 10, textStyle: { color: theme.subtext } },
    series: [{
      type: "funnel",
      left: "10%", right: "10%", top: config.title ? 50 : 30, bottom: 40,
      data: config.data.rows.map((r) => ({
        name: labelIdx >= 0 ? String(r[labelIdx]) : "",
        value: valueIdx >= 0 ? Number(r[valueIdx]) : 0,
      })),
      label: { color: theme.subtext },
    }],
  };
}

function buildTreemap(config: ChartConfig): echarts.EChartsOption {
  const labelIdx = config.data.types.findIndex((t) => t === "string");
  const valueIdx = config.data.types.findIndex((t) => t === "number");

  return {
    series: [{
      type: "treemap",
      data: config.data.rows.map((r) => ({
        name: labelIdx >= 0 ? String(r[labelIdx]) : "",
        value: valueIdx >= 0 ? Number(r[valueIdx]) : 0,
      })),
    }],
  };
}

function buildGauge(config: ChartConfig): echarts.EChartsOption {
  const labelIdx = config.data.types.findIndex((t) => t === "string");
  const valueIdx = config.data.types.findIndex((t) => t === "number");
  const theme = THEMES[config.theme];

  const firstRow = config.data.rows[0];
  return {
    series: [{
      type: "gauge",
      detail: { formatter: "{value}", color: theme.text },
      data: [{
        name: labelIdx >= 0 && firstRow ? String(firstRow[labelIdx]) : "",
        value: valueIdx >= 0 && firstRow ? Number(firstRow[valueIdx]) : 0,
      }],
    }],
  };
}
