import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { apiKeyAuth } from "../src/middleware/apiKeyAuth.js";

const app = new Hono();
app.use("*", apiKeyAuth);
app.get("/test", (c) => c.json({ ok: true }));

describe("API Key Auth", () => {
  it("should reject requests without an API key", async () => {
    const res = await app.request("/test");
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Missing API key");
  });

  it("should reject requests with an invalid API key", async () => {
    const res = await app.request("/test", {
      headers: { "x-api-key": "wrong-key" },
    });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Invalid API key");
  });

  it("should allow requests with a valid API key", async () => {
    const res = await app.request("/test", {
      headers: { "x-api-key": "test-api-key" },
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
