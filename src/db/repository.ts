import { v4 as uuidv4 } from "uuid";
import { getDb } from "./client.js";
import type { Message, Session } from "../types/index.js";

export function createSession(
  source: string,
  ipAddress?: string | null
): Session {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO sessions (id, ip_address, source, created_at, last_active_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, ipAddress ?? null, source, now, now);

  return { id, ip_address: ipAddress ?? null, source, created_at: now, last_active_at: now };
}

export function getSession(sessionId: string): Session | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId) as Session | undefined;
}

export function touchSession(sessionId: string): void {
  const db = getDb();
  db.prepare("UPDATE sessions SET last_active_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    sessionId
  );
}

export function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  source: string,
  ipAddress?: string | null
): Message {
  const db = getDb();
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  db.prepare(
    `INSERT INTO messages (id, session_id, timestamp, role, content, ip_address, source)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, sessionId, timestamp, role, content, ipAddress ?? null, source);

  return {
    id,
    session_id: sessionId,
    timestamp,
    role,
    content,
    ip_address: ipAddress ?? null,
    source,
    created_at: timestamp,
  };
}

export function getSessionMessages(
  sessionId: string,
  limit: number = 20
): Message[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM messages WHERE session_id = ?
       ORDER BY timestamp ASC LIMIT ?`
    )
    .all(sessionId, limit) as Message[];
}
