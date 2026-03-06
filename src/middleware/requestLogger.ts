import type { Context, Next } from "hono";
import { logger } from "../logger/index.js";

export async function requestLogger(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  logger.debug({ method, path }, "Incoming request");

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info({ method, path, status, duration: `${duration}ms` }, "Request completed");
}
