import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const healthResponseSchema = z
  .object({
    status: z.string(),
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
  return c.json({ status: "ok", timestamp: new Date().toISOString() }, 200);
});

export { health };
