import type { ChartType } from "../renderers/types.js";

export const DEFAULTS = {
  width: 800,
  height: 400,
  type: "line" as ChartType,
  theme: "light" as const,
  maxDataUrlSize: 1024 * 1024,
  fetchTimeout: 5000,
};

export const CHART_TYPES: ChartType[] = [
  "line", "bar", "pie", "area", "scatter",
  "radar", "heatmap", "candlestick", "funnel", "treemap", "gauge",
];

export const D3_TYPES: Set<ChartType> = new Set(["line", "bar", "pie", "area", "scatter"]);
export const ECHARTS_ONLY: Set<ChartType> = new Set(["radar", "heatmap", "candlestick", "funnel", "treemap", "gauge"]);
