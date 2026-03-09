import { timingSafeEqual } from "node:crypto";
import type { Context, Next } from "hono";
import { appConfig } from "../config/index.js";

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against itself to keep constant time, then return false
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function apiKeyAuth(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const apiKey = c.req.header("x-api-key");

  if (!apiKey) {
    return c.json({ error: "Missing API key" }, 401);
  }

  if (!constantTimeEqual(apiKey, appConfig.API_KEY)) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  await next();
}
