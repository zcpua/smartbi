import { DEFAULTS } from "../config/defaults.js";
import { DataFetchError } from "../errors/index.js";

export async function fetchData(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) {
    throw new DataFetchError("Only HTTP(S) URLs are supported");
  }

  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev) {
    const blocked = /^https?:\/\/(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/i;
    if (blocked.test(url)) {
      throw new DataFetchError("Private/local URLs are not allowed");
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULTS.fetchTimeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SmartBI/0.1" },
    });

    if (!res.ok) {
      throw new DataFetchError(`HTTP ${res.status} from data source`);
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > DEFAULTS.maxDataUrlSize) {
      throw new DataFetchError("Data source too large (>1MB)");
    }

    const text = await res.text();
    if (text.length > DEFAULTS.maxDataUrlSize) {
      throw new DataFetchError("Data source too large (>1MB)");
    }

    return text;
  } catch (e) {
    if (e instanceof DataFetchError) throw e;
    if ((e as Error).name === "AbortError") {
      throw new DataFetchError("Data source request timed out");
    }
    throw new DataFetchError(`Failed to fetch data: ${(e as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}
