const CACHE_TTL = 3600;

export function cacheHeaders(ttl: number = CACHE_TTL): Record<string, string> {
  return {
    "Cache-Control": `public, max-age=${ttl}, s-maxage=${ttl * 24}`,
  };
}
