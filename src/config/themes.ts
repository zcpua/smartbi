export interface Theme {
  background: string;
  text: string;
  subtext: string;
  grid: string;
  colors: string[];
}

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    background: "#ffffff",
    text: "#333333",
    subtext: "#666666",
    grid: "#e0e0e0",
    colors: [
      "#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de",
      "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc", "#48b8d0",
    ],
  },
  dark: {
    background: "#1a1a2e",
    text: "#e0e0e0",
    subtext: "#999999",
    grid: "#333355",
    colors: [
      "#4992ff", "#7cffb2", "#fddd60", "#ff6e76", "#58d9f9",
      "#05c091", "#ff8a45", "#8d48e3", "#dd79ff", "#12cfe7",
    ],
  },
};
