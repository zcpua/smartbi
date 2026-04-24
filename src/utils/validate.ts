import { CHART_TYPES, DEFAULTS } from "../config/defaults.js";
import { ValidationError } from "../errors/index.js";
import type { ChartType } from "../renderers/types.js";

export interface ValidatedQuery {
  source?: string;
  data?: string;
  type: ChartType;
  renderer?: "d3" | "echarts";
  colors: string[];
  title?: string;
  xlabel?: string;
  ylabel?: string;
  width: number;
  height: number;
  theme: "light" | "dark";
}

export function validateQuery(query: Record<string, string>): ValidatedQuery {
  const { source, data, type, renderer, colors, title, xlabel, ylabel, width, height, theme } = query;

  if (!source && !data) {
    throw new ValidationError("Either 'source' or 'data' parameter is required");
  }

  const chartType = (type || DEFAULTS.type) as ChartType;
  if (!CHART_TYPES.includes(chartType)) {
    throw new ValidationError(`Invalid chart type: ${type}. Supported: ${CHART_TYPES.join(", ")}`);
  }

  if (renderer && renderer !== "d3" && renderer !== "echarts") {
    throw new ValidationError("Invalid renderer. Supported: d3, echarts");
  }

  const parsedWidth = width ? parseInt(width, 10) : DEFAULTS.width;
  const parsedHeight = height ? parseInt(height, 10) : DEFAULTS.height;
  if (isNaN(parsedWidth) || parsedWidth < 100 || parsedWidth > 2000) {
    throw new ValidationError("Width must be between 100 and 2000");
  }
  if (isNaN(parsedHeight) || parsedHeight < 100 || parsedHeight > 2000) {
    throw new ValidationError("Height must be between 100 and 2000");
  }

  const parsedTheme = (theme === "dark" ? "dark" : "light") as "light" | "dark";

  const colorList = colors
    ? colors.split(",").map((c) => c.trim())
    : [];

  return {
    source,
    data,
    type: chartType,
    renderer: renderer as "d3" | "echarts" | undefined,
    colors: colorList,
    title,
    xlabel,
    ylabel,
    width: parsedWidth,
    height: parsedHeight,
    theme: parsedTheme,
  };
}
