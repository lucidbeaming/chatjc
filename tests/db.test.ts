import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../src/db/migrations.js";
import { v4 as uuidv4 } from "uuid";

function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
}

describe("Database", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe("migrations", () => {
    it("should create sessions table", () => {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
        .all();
      expect(tables).toHaveLength(1);
    });

    it("should create messages table", () => {
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'")
        .all();
      expect(tables).toHaveLength(1);
    });

    it("should be idempotent", () => {
      expect(() => runMigrations(db)).not.toThrow();
    });
  });

  describe("sessions", () => {
    it("should insert and retrieve a session", () => {
      const id = uuidv4();
      db.prepare(
        "INSERT INTO sessions (id, ip_address, source) VALUES (?, ?, ?)"
      ).run(id, "127.0.0.1", "api");

      const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as any;
      expect(session).toBeDefined();
      expect(session.ip_address).toBe("127.0.0.1");
      expect(session.source).toBe("api");
    });
  });

  describe("messages", () => {
    const sessionId = uuidv4();

    beforeEach(() => {
      db.prepare(
        "INSERT INTO sessions (id, ip_address, source) VALUES (?, ?, ?)"
      ).run(sessionId, "127.0.0.1", "api");
    });

    it("should insert and retrieve a message", () => {
      const msgId = uuidv4();
      db.prepare(
        `INSERT INTO messages (id, session_id, timestamp, role, content, ip_address, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(msgId, sessionId, new Date().toISOString(), "user", "Hello", "127.0.0.1", "api");

      const msg = db.prepare("SELECT * FROM messages WHERE id = ?").get(msgId) as any;
      expect(msg).toBeDefined();
      expect(msg.role).toBe("user");
      expect(msg.content).toBe("Hello");
    });

    it("should enforce role check constraint", () => {
      const msgId = uuidv4();
      expect(() =>
        db.prepare(
          `INSERT INTO messages (id, session_id, timestamp, role, content, source)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(msgId, sessionId, new Date().toISOString(), "invalid", "test", "api")
      ).toThrow();
    });

    it("should enforce foreign key on session_id", () => {
      const msgId = uuidv4();
      expect(() =>
        db.prepare(
          `INSERT INTO messages (id, session_id, timestamp, role, content, source)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(msgId, "nonexistent", new Date().toISOString(), "user", "test", "api")
      ).toThrow();
    });

    it("should retrieve messages ordered by timestamp", () => {
      const now = Date.now();
      for (let i = 0; i < 3; i++) {
        db.prepare(
          `INSERT INTO messages (id, session_id, timestamp, role, content, source)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          sessionId,
          new Date(now + i * 1000).toISOString(),
          i % 2 === 0 ? "user" : "assistant",
          `Message ${i}`,
          "api"
        );
      }

      const messages = db
        .prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC")
        .all(sessionId) as any[];

      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe("Message 0");
      expect(messages[2].content).toBe("Message 2");
    });
  });
});
