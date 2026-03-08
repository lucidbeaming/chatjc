import * as readline from "readline";
import { config } from "dotenv";

config();

const BASE_URL = process.env.API_URL ?? "http://localhost:9003";
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Error: API_KEY not found in .env");
  process.exit(1);
}
let sessionId: string | null = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(): void {
  rl.question("\nYou: ", async (input) => {
    const trimmed = input.trim();

    if (!trimmed) {
      prompt();
      return;
    }

    if (trimmed === "/quit" || trimmed === "/exit") {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    if (trimmed === "/reset") {
      sessionId = null;
      console.log("Session reset.");
      prompt();
      return;
    }

    if (trimmed === "/help") {
      console.log("Commands: /reset (new session), /quit or /exit (leave)");
      prompt();
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify({
          message: trimmed,
          source: "api",
          ...(sessionId && { session_id: sessionId }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(`Error (${res.status}):`, err.error ?? err);
        prompt();
        return;
      }

      const data = await res.json();
      sessionId = data.session_id;
      console.log(`\nBot: ${data.response}`);
    } catch (err) {
      console.error("Connection error:", (err as Error).message);
    }

    prompt();
  });
}

console.log("chatjc CLI — talk to the chatbot");
console.log("Commands: /reset /quit /help\n");
prompt();
