import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { appConfig } from "../config/index.js";

export const corsMiddleware = cors({
  origin: appConfig.CORS_ORIGIN,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  maxAge: 86400,
});

export const secureHeadersMiddleware = secureHeaders();
