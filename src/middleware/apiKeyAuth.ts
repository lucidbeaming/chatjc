import type { Context, Next } from "hono";
import { appConfig } from "../config/index.js";

export async function apiKeyAuth(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const apiKey = c.req.header("x-api-key");

  if (!apiKey) {
    return c.json({ error: "Missing API key" }, 401);
  }

  if (apiKey !== appConfig.API_KEY) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  await next();
}
