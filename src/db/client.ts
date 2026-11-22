import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { appConfig } from "../config/index.js";
import { logger } from "../logger/index.js";
import { runMigrations } from "./migrations.js";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

export function initDb(dbPath?: string): Database.Database {
  const path = dbPath ?? appConfig.DB_PATH;
  // better-sqlite3 creates the file but not its folder, and data/ is gitignored.
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  logger.info({ path }, "Database initialized");
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    logger.info("Database closed");
  }
}
