import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { appConfig } from "./config/index.js";
import { initDb } from "./db/client.js";
import { initializeRAG } from "./services/rag.js";
import { logger } from "./logger/index.js";

async function main(): Promise<void> {
  initDb();
  await initializeRAG();

  serve(
    { fetch: app.fetch, port: appConfig.PORT, hostname: appConfig.HOST },
    (info) => {
      logger.info(
        { port: info.port, host: appConfig.HOST },
        "Server started"
      );
    }
  );
}

main().catch((error) => {
  logger.error(error, "Failed to start server");
  process.exit(1);
});
