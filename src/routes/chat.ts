import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import {
  createSession,
  getSession,
  touchSession,
  addMessage,
  getSessionMessages,
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

const chatRequestSchema = z.object({
  session_id: z.string().uuid().optional(),
  message: z.string().min(1),
  source: z.enum(["web_component", "api"]).default("api"),
});

const chat = new Hono();

chat.post("/", zValidator("json", chatRequestSchema), async (c) => {
  const body = c.req.valid("json");
  const ipAddress =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    null;

  const sanitized = sanitizeInput(body.message);

  const inputCheck = validateInput(sanitized);
  if (!inputCheck.passed) {
    return c.json({ error: inputCheck.reason }, 400);
  }

  let sessionId = body.session_id;

  if (sessionId) {
    const existing = getSession(sessionId);
    if (!existing) {
      return c.json({ error: "Invalid session_id" }, 400);
    }
    touchSession(sessionId);
  } else {
    const session = createSession(body.source, ipAddress);
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
        { sessionId, inputLength: sanitized.length, responseLength: response.length },
        "Chat response generated",
      );
    } else {
      logger.info(
        { sessionId, message: sanitized, response },
        "Chat response generated",
      );
    }

    return c.json({
      session_id: sessionId,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Privacy: never log user message content in error output
    logger.error({ error, sessionId }, "RAG query failed");
    return c.json({ error: "Failed to generate response" }, 500);
  }
});

export { chat };
