export type ColumnType = "string" | "number" | "date";

export interface ParsedData {
  headers: string[];
  rows: (string | number)[][];
  types: ColumnType[];
}

export type ChartType =
  | "line"
  | "bar"
  | "pie"
  | "area"
  | "scatter"
  | "radar"
  | "heatmap"
  | "candlestick"
  | "funnel"
  | "treemap"
  | "gauge";

export interface ChartConfig {
  type: ChartType;
  data: ParsedData;
  width: number;
  height: number;
  title?: string;
  xlabel?: string;
  ylabel?: string;
  colors: string[];
  theme: "light" | "dark";
}

export interface ChartRenderer {
  readonly supportedTypes: ChartType[];
  render(config: ChartConfig): Promise<string>;
}
