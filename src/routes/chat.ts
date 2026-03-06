import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
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

    logger.info({ sessionId, inputLength: sanitized.length }, "Chat response generated");

    return c.json({
      session_id: sessionId,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error, sessionId }, "RAG query failed");
    return c.json({ error: "Failed to generate response" }, 500);
  }
});

export { chat };
