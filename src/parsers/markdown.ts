import type { ParsedData, ColumnType } from "../renderers/types.js";
import { ParseError } from "../errors/index.js";

export function parseMarkdownTable(text: string): ParsedData {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new ParseError("Markdown table requires at least a header and separator row");
  }

  const headerLine = lines[0];
  const separatorLine = lines[1];

  if (!/^[\s|:\-]+$/.test(separatorLine)) {
    throw new ParseError("Invalid markdown table: missing separator row");
  }

  const headers = splitRow(headerLine);
  if (headers.length === 0) {
    throw new ParseError("Markdown table has no headers");
  }

  const rows: (string | number)[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    const row: (string | number)[] = headers.map((_, idx) => {
      const val = (cells[idx] || "").trim();
      const num = Number(val);
      if (val !== "" && !isNaN(num)) return num;
      return val;
    });
    rows.push(row);
  }

  const types: ColumnType[] = headers.map((_, colIdx) => {
    let numberCount = 0;
    let sampleCount = 0;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const val = rows[i][colIdx];
      if (val === "" || val === null || val === undefined) continue;
      sampleCount++;
      if (typeof val === "number") numberCount++;
    }
    if (sampleCount > 0 && numberCount === sampleCount) return "number";
    return "string";
  });

  return { headers, rows, types };
}

function splitRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((s) => s.trim());
}
