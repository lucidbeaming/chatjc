import type { Context, Next } from "hono";
import { appConfig } from "../config/index.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60000);

// Rate limit by API key (validated upstream by apiKeyAuth middleware)
// rather than IP headers which can be spoofed.
function getRateLimitKey(c: Context): string {
  return c.req.header("x-api-key") ?? "unknown";
}

export async function rateLimiter(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const key = getRateLimitKey(c);
  const now = Date.now();
  const windowMs = appConfig.RATE_LIMIT_WINDOW_MS;
  const max = appConfig.RATE_LIMIT_MAX;

  let entry = store.get(key);

  // Atomic: reset window if expired, then increment in one step
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
  } else {
    entry.count++;
  }

  c.header("X-RateLimit-Limit", String(max));
  c.header("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
  c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    return c.json({ error: "Too many requests" }, 429);
  }

  await next();
}

export function resetRateLimitStore(): void {
  store.clear();
}
