import type { ParsedData } from "../renderers/types.js";
import { parseCsv } from "./csv.js";
import { parseMarkdownTable } from "./markdown.js";

export function parseData(text: string): ParsedData {
  const trimmed = text.trim();
  if (looksLikeMarkdownTable(trimmed)) {
    return parseMarkdownTable(trimmed);
  }
  return parseCsv(trimmed);
}

function looksLikeMarkdownTable(text: string): boolean {
  const lines = text.split("\n");
  if (lines.length < 2) return false;
  return lines[0].includes("|") && /^[\s|:\-]+$/.test(lines[1].trim());
}
