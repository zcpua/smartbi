import { D3_TYPES, ECHARTS_ONLY } from "../config/defaults.js";
import { ValidationError } from "../errors/index.js";
import { D3Renderer } from "./d3.js";
import { EChartsRenderer } from "./echarts.js";
import type { ChartRenderer, ChartType } from "./types.js";

const d3Renderer = new D3Renderer();
const echartsRenderer = new EChartsRenderer();

export function getRenderer(type: ChartType, preference?: "d3" | "echarts"): ChartRenderer {
  if (preference === "d3") {
    if (!d3Renderer.supportedTypes.includes(type)) {
      throw new ValidationError(`D3 renderer does not support chart type "${type}". Use renderer=echarts instead.`);
    }
    return d3Renderer;
  }

  if (preference === "echarts") {
    return echartsRenderer;
  }

  if (ECHARTS_ONLY.has(type)) return echartsRenderer;
  if (D3_TYPES.has(type)) return d3Renderer;
  return echartsRenderer;
}
