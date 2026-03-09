import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json") as { version: string };

const healthResponseSchema = z
  .object({
    status: z.string(),
    version: z.string(),
    timestamp: z.string().datetime(),
  })
  .openapi("HealthResponse");

const healthRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  summary: "Health check",
  description: "Returns the current health status of the API",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: healthResponseSchema,
        },
      },
    },
  },
});

const health = new OpenAPIHono();

health.openapi(healthRoute, (c) => {
  return c.json({ status: "ok", version, timestamp: new Date().toISOString() }, 200);
});

export { health };
