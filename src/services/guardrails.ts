import { appConfig } from "../config/index.js";
import { logger } from "../logger/index.js";

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+/i,
  /forget\s+(all\s+)?(your|previous)\s+(instructions|rules|prompts)/i,
  /system\s*prompt/i,
  /reveal\s+(your|the)\s+(instructions|prompt|system)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+(if|though|a\s+different)/i,
  /override\s+(your|the|all)\s+(instructions|rules)/i,
  /disregard\s+(all|any|your|previous)/i,
  /new\s+instructions?\s*:/i,
];

// Normalize unicode confusables and whitespace variations before
// running injection detection to prevent bypass via lookalike characters
// or irregular spacing (e.g. "ｉｇｎｏｒｅ", "ignore   all").
function normalizeForDetection(input: string): string {
  return (
    input
      // Normalize unicode to ASCII-compatible form (e.g. fullwidth → ASCII)
      .normalize("NFKC")
      // Collapse multiple whitespace characters into a single space
      .replace(/\s+/g, " ")
  );
}

export function validateInput(message: string): GuardrailResult {
  if (!message || message.trim().length === 0) {
    return { passed: false, reason: "Message cannot be empty" };
  }

  if (message.length > appConfig.MAX_INPUT_LENGTH) {
    return {
      passed: false,
      reason: `Message exceeds maximum length of ${appConfig.MAX_INPUT_LENGTH} characters`,
    };
  }

  const normalized = normalizeForDetection(message);

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      logger.warn(
        { pattern: pattern.source },
        "Prompt injection attempt detected",
      );
      return {
        passed: false,
        reason:
          "I can only answer questions about the developer's professional background.",
      };
    }
  }

  return { passed: true };
}

export function validateOutput(response: string): string {
  if (response.length > appConfig.MAX_RESPONSE_LENGTH) {
    logger.debug(
      { original: response.length, limit: appConfig.MAX_RESPONSE_LENGTH },
      "Truncating response",
    );
    return response.slice(0, appConfig.MAX_RESPONSE_LENGTH).trimEnd() + "...";
  }
  return response;
}

export function sanitizeInput(message: string): string {
  return (
    message
      .replace(/<[^>]*>/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .trim()
  );
}
