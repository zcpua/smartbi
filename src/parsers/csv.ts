import Papa from "papaparse";
import type { ParsedData, ColumnType } from "../renderers/types.js";
import { ParseError } from "../errors/index.js";

export function parseCsv(text: string): ParsedData {
  const cleaned = text.replace(/^﻿/, "");
  const result = Papa.parse(cleaned.trim(), {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && (!result.data || result.data.length === 0)) {
    throw new ParseError(`CSV parse error: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields;
  if (!headers || headers.length === 0) {
    throw new ParseError("CSV has no headers");
  }

  const rows: (string | number)[][] = [];
  for (const row of result.data as Record<string, unknown>[]) {
    rows.push(headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined || val === "") return "";
      return val as string | number;
    }));
  }

  const types = inferTypes(headers, rows);

  return { headers, rows, types };
}

function inferTypes(headers: string[], rows: (string | number)[][]): ColumnType[] {
  return headers.map((_, colIdx) => {
    let numberCount = 0;
    let sampleCount = 0;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const val = rows[i][colIdx];
      if (val === "" || val === null || val === undefined) continue;
      sampleCount++;
      if (typeof val === "number") {
        numberCount++;
      }
    }
    if (sampleCount > 0 && numberCount === sampleCount) return "number";
    return "string";
  });
}
