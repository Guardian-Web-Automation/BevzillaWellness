/** Console messages we treat as third-party noise, not defects. Tune as needed. */
export const IGNORE_CONSOLE: RegExp[] = [
  /favicon/i, /gtag/i, /google/i, /analytics/i, /facebook/i, /klaviyo/i,
  /pixel/i, /hotjar/i, /clarity/i, /doubleclick/i, /tiktok/i,
  // Shopify / Hydrogen platform noise (beacons, pixels, tracking) — not defects.
  /shopify/i, /monorail/i, /web-pixel/i, /trekkie/i, /perf-kit/i,
];

/** Failed-response URLs we treat as third-party noise. */
export const IGNORE_RESPONSE: RegExp[] = [
  /favicon/i, /gtag/i, /google/i, /analytics/i, /facebook/i, /klaviyo/i,
  /hotjar/i, /clarity/i, /doubleclick/i, /tiktok/i,
  // Shopify / Hydrogen analytics beacon routes (may be same-origin).
  // NOTE: kept narrow on purpose — a broken same-origin image/asset must still fail.
  /monorail/i, /web-pixel/i, /trekkie/i, /\/wpm\//i,
];

export function filterNoise(items: string[], patterns: RegExp[]): string[] {
  return items.filter((t) => !patterns.some((p) => p.test(t)));
}

export function sameOrigin(url: string, base: string): boolean {
  try {
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
}
