import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";
import * as d3Scale from "d3-scale";
import * as d3Selection from "d3-selection";
import * as d3Shape from "d3-shape";
import * as d3Format from "d3-format";
import { parseHTML } from "linkedom";
import { THEMES } from "../config/themes.js";
import type { ChartConfig, ChartRenderer, ChartType, ParsedData } from "./types.js";

const MARGIN = { top: 40, right: 30, bottom: 50, left: 60 };
const FONT_FAMILY = "Arial, Helvetica, sans-serif";

export class D3Renderer implements ChartRenderer {
  readonly supportedTypes: ChartType[] = ["line", "bar", "area", "scatter", "pie"];

  async render(config: ChartConfig): Promise<string> {
    const { document } = parseHTML("<!DOCTYPE html><html><body></body></html>");
    const body = d3Selection.select(document.body);

    const svg = body
      .append("svg")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("width", config.width)
      .attr("height", config.height)
      .attr("viewBox", `0 0 ${config.width} ${config.height}`)
      .attr("font-family", FONT_FAMILY);

    const theme = THEMES[config.theme];
    const colors = config.colors.length > 0 ? config.colors : theme.colors;

    svg
      .append("rect")
      .attr("width", config.width)
      .attr("height", config.height)
      .attr("fill", theme.background);

    switch (config.type) {
      case "line":
        renderLine(svg, config, theme, colors);
        break;
      case "bar":
        renderBar(svg, config, theme, colors);
        break;
      case "area":
        renderArea(svg, config, theme, colors);
        break;
      case "scatter":
        renderScatter(svg, config, theme, colors);
        break;
      case "pie":
        renderPie(svg, config, theme, colors);
        break;
    }

    return (svg.node() as any).outerHTML;
  }
}

function getSeriesData(data: ParsedData) {
  const labelIdx = data.types.findIndex((t) => t === "string") ?? 0;
  const numericIndices = data.types
    .map((t, i) => (t === "number" ? i : -1))
    .filter((i) => i >= 0);
  const labels = data.rows.map((r) => String(r[labelIdx]));
  const series = numericIndices.map((idx) => ({
    name: data.headers[idx],
    values: data.rows.map((r) => (typeof r[idx] === "number" ? (r[idx] as number) : 0)),
  }));
  return { labels, series, labelIdx, numericIndices };
}

function renderLine(
  svg: d3Selection.Selection<any, any, any, any>,
  config: ChartConfig,
  theme: any,
  colors: string[],
) {
  const { width, height } = config;
  const { labels, series } = getSeriesData(config.data);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const x = d3Scale.scalePoint().domain(labels).range([0, innerW]).padding(0.5);

  const allValues = series.flatMap((s) => s.values);
  const yMin = d3Array.min(allValues) ?? 0;
  const yMax = d3Array.max(allValues) ?? 1;
  const yPad = (yMax - yMin) * 0.1 || 1;
  const y = d3Scale.scaleLinear().domain([Math.min(0, yMin - yPad), yMax + yPad]).nice().range([innerH, 0]);

  drawGrid(g, innerW, innerH, y, theme);
  drawAxes(g, x, y, innerW, innerH, theme, config);

  for (let si = 0; si < series.length; si++) {
    const line = d3Shape
      .line<number>()
      .x((_, i) => x(labels[i])!)
      .y((d) => y(d));

    g.append("path")
      .datum(series[si].values)
      .attr("fill", "none")
      .attr("stroke", colors[si % colors.length])
      .attr("stroke-width", 2.5)
      .attr("d", line as any);

    g.selectAll(`.dot-${si}`)
      .data(series[si].values)
      .enter()
      .append("circle")
      .attr("cx", (_, i) => x(labels[i])!)
      .attr("cy", (d: number) => y(d))
      .attr("r", 3.5)
      .attr("fill", colors[si % colors.length]);
  }

  if (series.length > 1) drawLegend(svg, series.map((s) => s.name), colors, width, theme);
  if (config.title) drawTitle(svg, config.title, width, theme);
}

function renderBar(
  svg: d3Selection.Selection<any, any, any, any>,
  config: ChartConfig,
  theme: any,
  colors: string[],
) {
  const { width, height } = config;
  const { labels, series } = getSeriesData(config.data);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const x0 = d3Scale.scaleBand().domain(labels).range([0, innerW]).padding(0.2);
  const x1 = d3Scale
    .scaleBand()
    .domain(series.map((_, i) => String(i)))
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const allValues = series.flatMap((s) => s.values);
  const yMax = d3Array.max(allValues) ?? 1;
  const y = d3Scale.scaleLinear().domain([0, yMax * 1.1]).nice().range([innerH, 0]);

  drawGrid(g, innerW, innerH, y, theme);
  drawAxes(g, x0, y, innerW, innerH, theme, config);

  for (let si = 0; si < series.length; si++) {
    g.selectAll(`.bar-${si}`)
      .data(series[si].values)
      .enter()
      .append("rect")
      .attr("x", (_, i) => (x0(labels[i]) ?? 0) + (x1(String(si)) ?? 0))
      .attr("y", (d: number) => y(d))
      .attr("width", x1.bandwidth())
      .attr("height", (d: number) => innerH - y(d))
      .attr("fill", colors[si % colors.length])
      .attr("rx", 2);
  }

  if (series.length > 1) drawLegend(svg, series.map((s) => s.name), colors, width, theme);
  if (config.title) drawTitle(svg, config.title, width, theme);
}

function renderArea(
  svg: d3Selection.Selection<any, any, any, any>,
  config: ChartConfig,
  theme: any,
  colors: string[],
) {
  const { width, height } = config;
  const { labels, series } = getSeriesData(config.data);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const x = d3Scale.scalePoint().domain(labels).range([0, innerW]).padding(0.5);
  const allValues = series.flatMap((s) => s.values);
  const yMax = d3Array.max(allValues) ?? 1;
  const y = d3Scale.scaleLinear().domain([0, yMax * 1.1]).nice().range([innerH, 0]);

  drawGrid(g, innerW, innerH, y, theme);
  drawAxes(g, x, y, innerW, innerH, theme, config);

  for (let si = 0; si < series.length; si++) {
    const area = d3Shape
      .area<number>()
      .x((_, i) => x(labels[i])!)
      .y0(innerH)
      .y1((d) => y(d));

    const color = colors[si % colors.length];
    g.append("path")
      .datum(series[si].values)
      .attr("fill", color)
      .attr("fill-opacity", 0.3)
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", area as any);
  }

  if (series.length > 1) drawLegend(svg, series.map((s) => s.name), colors, width, theme);
  if (config.title) drawTitle(svg, config.title, width, theme);
}

function renderScatter(
  svg: d3Selection.Selection<any, any, any, any>,
  config: ChartConfig,
  theme: any,
  colors: string[],
) {
  const { width, height, data } = config;
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const numericCols = data.types
    .map((t, i) => (t === "number" ? i : -1))
    .filter((i) => i >= 0);

  const xIdx = numericCols[0] ?? 0;
  const yIndices = numericCols.slice(1);
  if (yIndices.length === 0 && numericCols.length >= 1) {
    yIndices.push(numericCols[0]);
  }

  const xValues = data.rows.map((r) => Number(r[xIdx]) || 0);
  const xExtent = d3Array.extent(xValues) as [number, number];
  const x = d3Scale.scaleLinear().domain(xExtent).nice().range([0, innerW]);

  const allY = yIndices.flatMap((yi) => data.rows.map((r) => Number(r[yi]) || 0));
  const yExtent = d3Array.extent(allY) as [number, number];
  const y = d3Scale.scaleLinear().domain(yExtent).nice().range([innerH, 0]);

  drawGrid(g, innerW, innerH, y, theme);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3Axis.axisBottom(x).ticks(6))
    .call((sel) => styleAxis(sel, theme));

  g.append("g")
    .call(d3Axis.axisLeft(y).ticks(6))
    .call((sel) => styleAxis(sel, theme));

  for (let si = 0; si < yIndices.length; si++) {
    const yi = yIndices[si];
    g.selectAll(`.dot-${si}`)
      .data(data.rows)
      .enter()
      .append("circle")
      .attr("cx", (r: any) => x(Number(r[xIdx]) || 0))
      .attr("cy", (r: any) => y(Number(r[yi]) || 0))
      .attr("r", 4)
      .attr("fill", colors[si % colors.length])
      .attr("fill-opacity", 0.7);
  }

  if (yIndices.length > 1)
    drawLegend(svg, yIndices.map((i) => data.headers[i]), colors, width, theme);
  if (config.title) drawTitle(svg, config.title, width, theme);
}

function renderPie(
  svg: d3Selection.Selection<any, any, any, any>,
  config: ChartConfig,
  theme: any,
  colors: string[],
) {
  const { width, height, data } = config;

  const labelIdx = data.types.findIndex((t) => t === "string");
  const valueIdx = data.types.findIndex((t) => t === "number");
  if (valueIdx < 0) return;

  const pieData = data.rows.map((r) => ({
    label: labelIdx >= 0 ? String(r[labelIdx]) : "",
    value: Number(r[valueIdx]) || 0,
  }));

  const radius = Math.min(width, height) / 2 - 40;
  const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  const pie = d3Shape
    .pie<(typeof pieData)[0]>()
    .value((d) => d.value)
    .sort(null);

  const arc = d3Shape.arc<d3Shape.PieArcDatum<(typeof pieData)[0]>>().innerRadius(0).outerRadius(radius);
  const labelArc = d3Shape
    .arc<d3Shape.PieArcDatum<(typeof pieData)[0]>>()
    .innerRadius(radius * 0.6)
    .outerRadius(radius * 0.6);

  const arcs = pie(pieData);

  arcs.forEach((d, i) => {
    g.append("path")
      .attr("d", arc(d)!)
      .attr("fill", colors[i % colors.length])
      .attr("stroke", theme.background)
      .attr("stroke-width", 2);
  });

  arcs.forEach((d, i) => {
    if (d.data.label) {
      const [lx, ly] = labelArc.centroid(d);
      g.append("text")
        .attr("x", lx)
        .attr("y", ly)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", theme.text)
        .attr("font-size", 12)
        .text(d.data.label);
    }
  });

  if (config.title) drawTitle(svg, config.title, width, theme);
}

function drawGrid(
  g: d3Selection.Selection<any, any, any, any>,
  innerW: number,
  innerH: number,
  yScale: d3Scale.ScaleLinear<number, number>,
  theme: any,
) {
  const ticks = yScale.ticks(6);
  ticks.forEach((tick) => {
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", yScale(tick))
      .attr("y2", yScale(tick))
      .attr("stroke", theme.grid)
      .attr("stroke-dasharray", "3,3")
      .attr("stroke-width", 0.5);
  });
}

function drawAxes(
  g: d3Selection.Selection<any, any, any, any>,
  xScale: any,
  yScale: d3Scale.ScaleLinear<number, number>,
  innerW: number,
  innerH: number,
  theme: any,
  config: ChartConfig,
) {
  const xAxis = g
    .append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3Axis.axisBottom(xScale).ticks?.(8) ?? d3Axis.axisBottom(xScale));
  styleAxis(xAxis, theme);

  if (xScale.bandwidth) {
    const tickCount = xScale.domain().length;
    if (tickCount > 12) {
      xAxis.selectAll("text").attr("transform", "rotate(-45)").attr("text-anchor", "end");
    }
  }

  const yAxis = g.append("g").call(d3Axis.axisLeft(yScale).ticks(6).tickFormat(d3Format.format("~s")));
  styleAxis(yAxis, theme);

  if (config.xlabel) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 40)
      .attr("text-anchor", "middle")
      .attr("fill", theme.subtext)
      .attr("font-size", 12)
      .text(config.xlabel);
  }

  if (config.ylabel) {
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .attr("fill", theme.subtext)
      .attr("font-size", 12)
      .text(config.ylabel);
  }
}

function styleAxis(sel: d3Selection.Selection<any, any, any, any>, theme: any) {
  sel.selectAll("line").attr("stroke", theme.grid);
  sel.selectAll("path").attr("stroke", theme.grid);
  sel.selectAll("text").attr("fill", theme.subtext).attr("font-size", 11);
}

function drawLegend(
  svg: d3Selection.Selection<any, any, any, any>,
  names: string[],
  colors: string[],
  svgWidth: number,
  theme: any,
) {
  const legendG = svg.append("g").attr("transform", `translate(${svgWidth - 20}, ${MARGIN.top + 10})`);
  names.forEach((name, i) => {
    const itemG = legendG.append("g").attr("transform", `translate(0, ${i * 20})`);
    itemG.append("rect").attr("x", -80).attr("width", 12).attr("height", 12).attr("fill", colors[i % colors.length]).attr("rx", 2);
    itemG.append("text").attr("x", -64).attr("y", 10).attr("fill", theme.subtext).attr("font-size", 11).text(name);
  });
}

function drawTitle(
  svg: d3Selection.Selection<any, any, any, any>,
  title: string,
  svgWidth: number,
  theme: any,
) {
  svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("fill", theme.text)
    .attr("font-size", 16)
    .attr("font-weight", "bold")
    .text(title);
}
