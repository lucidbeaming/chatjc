import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import {
  createSession,
  getSession,
  touchSession,
  addMessage,
  getSessionMessages,
  hashApiKey,
} from "../db/repository.js";
import { queryRAG } from "../services/rag.js";
import {
  validateInput,
  validateOutput,
  sanitizeInput,
} from "../services/guardrails.js";
import { logger } from "../logger/index.js";

// Privacy: message content is only logged in non-production environments.
// In production, only metadata (session ID, message length) is logged.
// Full message content is always persisted to SQLite for session continuity
// regardless of environment. The chat CLI script logs messages locally
// via console output, independent of server-side logging.
const isProduction = process.env.NODE_ENV === "production";

const chatRequestSchema = z
  .object({
    session_id: z.string().uuid().optional(),
    message: z.string().min(1),
    source: z.enum(["web_component", "api"]).default("api"),
  })
  .openapi("ChatRequest");

const chatResponseSchema = z
  .object({
    session_id: z.string().uuid(),
    response: z.string(),
    timestamp: z.string().datetime(),
  })
  .openapi("ChatResponse");

const errorSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

const chatRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Chat"],
  summary: "Send a chat message",
  description:
    "Send a message to the chatbot and receive a RAG-powered response. Optionally include a session_id to continue a conversation.",
  security: [{ ApiKeyAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: chatRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Chat response generated successfully",
      content: {
        "application/json": {
          schema: chatResponseSchema,
        },
      },
    },
    400: {
      description:
        "Invalid input (empty, too long, or prompt injection detected)",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    401: {
      description: "Missing or invalid API key",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    403: {
      description: "Session does not belong to the provided API key",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    429: {
      description: "Rate limit exceeded",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    500: {
      description: "Internal server error during response generation",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

const chat = new OpenAPIHono();

chat.openapi(chatRoute, async (c) => {
  const body = c.req.valid("json");
  const ipAddress =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    null;

  // Validate raw input first to prevent bypassing injection detection
  // via HTML tags or control characters that sanitization would strip
  const rawCheck = validateInput(body.message);
  if (!rawCheck.passed) {
    return c.json({ error: rawCheck.reason! }, 400);
  }

  const sanitized = sanitizeInput(body.message);

  const sanitizedCheck = validateInput(sanitized);
  if (!sanitizedCheck.passed) {
    return c.json({ error: sanitizedCheck.reason! }, 400);
  }

  // Bind sessions to API key hash to prevent session enumeration/hijacking.
  // Only the client that created a session can reuse it.
  const apiKey = c.req.header("x-api-key") ?? "";
  const keyHash = hashApiKey(apiKey);

  let sessionId = body.session_id;

  if (sessionId) {
    const existing = getSession(sessionId);
    if (!existing) {
      return c.json({ error: "Invalid session_id" }, 400);
    }
    if (existing.api_key_hash && existing.api_key_hash !== keyHash) {
      return c.json({ error: "Invalid session_id" }, 403);
    }
    touchSession(sessionId);
  } else {
    const session = createSession(body.source, ipAddress, keyHash);
    sessionId = session.id;
  }

  addMessage(sessionId, "user", sanitized, body.source, ipAddress);

  const history = getSessionMessages(sessionId);

  try {
    const rawResponse = await queryRAG(sanitized, history);
    const response = validateOutput(rawResponse);

    addMessage(sessionId, "assistant", response, body.source);

    if (isProduction) {
      logger.info(
        {
          sessionId,
          inputLength: sanitized.length,
          responseLength: response.length,
        },
        "Chat response generated",
      );
    } else {
      logger.info(
        { sessionId, message: sanitized, response },
        "Chat response generated",
      );
    }

    return c.json(
      {
        session_id: sessionId,
        response,
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    // Privacy: never log user message content in error output
    logger.error({ error, sessionId }, "RAG query failed");
    return c.json({ error: "Failed to generate response" }, 500);
  }
});

export { chat };
