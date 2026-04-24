import { Resvg, initWasm } from "@resvg/resvg-wasm";

let wasmInitialized = false;

async function ensureWasm() {
  if (wasmInitialized) return;
  try {
    const wasmUrl = new URL("@resvg/resvg-wasm/index_bg.wasm", import.meta.url);
    const wasmResponse = await fetch(wasmUrl);
    const wasmBytes = await wasmResponse.arrayBuffer();
    await initWasm(wasmBytes);
  } catch {
    await initWasm();
  }
  wasmInitialized = true;
}

export async function svgToPng(svg: string, width: number): Promise<Uint8Array> {
  await ensureWasm();

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width" as const, value: width },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}
