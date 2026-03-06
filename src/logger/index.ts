import pino from "pino";
import { appConfig } from "../config/index.js";

export const logger = pino({
  level: appConfig.LOG_LEVEL,
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
