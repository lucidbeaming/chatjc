import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { rateLimiter, resetRateLimitStore } from "../src/middleware/rateLimiter.js";

const app = new Hono();
app.use("*", rateLimiter);
app.get("/test", (c) => c.json({ ok: true }));

const headers = { "x-api-key": "test-api-key" };

describe("Rate Limiter", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("should allow requests within the limit", async () => {
    const res = await app.request("/test", { headers });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
    expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();
  });

  it("should return 429 when limit is exceeded", async () => {
    // Default limit is 20 per window
    for (let i = 0; i < 20; i++) {
      await app.request("/test", { headers });
    }

    const res = await app.request("/test", { headers });
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toBe("Too many requests");
    expect(res.headers.get("Retry-After")).toBeDefined();
  });

  it("should include rate limit headers", async () => {
    const res = await app.request("/test", { headers });
    expect(res.headers.get("X-RateLimit-Limit")).toBe("20");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("19");
    expect(res.headers.get("X-RateLimit-Reset")).toBeDefined();
  });

  it("should track rate limits independently per API key", async () => {
    for (let i = 0; i < 20; i++) {
      await app.request("/test", { headers: { "x-api-key": "key-a" } });
    }

    // key-a is exhausted
    const resA = await app.request("/test", { headers: { "x-api-key": "key-a" } });
    expect(resA.status).toBe(429);

    // key-b still has quota
    const resB = await app.request("/test", { headers: { "x-api-key": "key-b" } });
    expect(resB.status).toBe(200);
  });
});
