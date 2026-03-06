import { Hono } from "hono";
import { corsMiddleware, secureHeadersMiddleware } from "./middleware/security.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { health } from "./routes/health.js";
import { chat } from "./routes/chat.js";

const app = new Hono();

app.use("*", corsMiddleware);
app.use("*", secureHeadersMiddleware);
app.use("*", requestLogger);
app.use("/api/chat/*", rateLimiter);

app.route("/api/health", health);
app.route("/api/chat", chat);

export { app };
