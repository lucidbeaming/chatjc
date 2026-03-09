import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { Context, Next } from "hono";
import { appConfig } from "../config/index.js";

export const corsMiddleware = cors({
  origin: (origin) => (origin === appConfig.CORS_ORIGIN ? origin : ""),
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "x-api-key"],
  maxAge: 86400,
});

export const secureHeadersMiddleware = secureHeaders();

// CSRF protection: reject cross-origin POST requests from browsers.
// Browser requests include an Origin header; non-browser clients (curl,
// server-to-server) typically do not. When Origin is present, it must
// match the configured CORS origin to proceed.
export async function csrfProtection(
  c: Context,
  next: Next,
): Promise<Response | void> {
  if (c.req.method !== "POST") {
    return next();
  }

  const origin = c.req.header("origin");
  if (origin && origin !== appConfig.CORS_ORIGIN) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
}
