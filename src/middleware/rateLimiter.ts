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

function getClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

export async function rateLimiter(c: Context, next: Next): Promise<Response | void> {
  const ip = getClientIp(c);
  const now = Date.now();
  const windowMs = appConfig.RATE_LIMIT_WINDOW_MS;
  const max = appConfig.RATE_LIMIT_MAX;

  let entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(ip, entry);
  }

  entry.count++;

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
