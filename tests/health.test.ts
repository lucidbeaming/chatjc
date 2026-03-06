import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { health } from "../src/routes/health.js";

const app = new Hono();
app.route("/api/health", health);

describe("GET /api/health", () => {
  it("should return 200 with status ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});
