import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import {
  corsMiddleware,
  secureHeadersMiddleware,
  csrfProtection,
} from "./middleware/security.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { health } from "./routes/health.js";
import { chat } from "./routes/chat.js";

const app = new OpenAPIHono();

app.use("*", corsMiddleware);
app.use("*", secureHeadersMiddleware);
app.use("*", requestLogger);
app.use("/api/chat/*", csrfProtection);
app.use("/api/chat/*", apiKeyAuth);
app.use("/api/chat/*", rateLimiter);
app.use("/api/doc", apiKeyAuth);
app.use("/api/docs", apiKeyAuth);

app.route("/api/health", health);
app.route("/api/chat", chat);

app.doc("/api/doc", {
  openapi: "3.1.0",
  info: {
    title: "chatjc API",
    version: "1.1.2",
    description:
      "REST API for a RAG-powered chatbot that answers questions about a developer's skills and job history.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],
  security: [{ ApiKeyAuth: [] }],
});

app.openAPIRegistry.registerComponent("securitySchemes", "ApiKeyAuth", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key",
  description: "API key for authentication",
});

app.get("/api/docs", swaggerUI({ url: "/api/doc" }));

export { app };
