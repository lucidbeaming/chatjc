import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const key = randomBytes(32).toString("base64url");
const envPath = resolve(import.meta.dirname!, "../.env");

console.log(`API_KEY=${key}`);

if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");

  if (/^API_KEY=.+/m.test(content)) {
    writeFileSync(envPath, content.replace(/^API_KEY=.+/m, `API_KEY=${key}`));
    console.log("Updated existing API_KEY in .env");
  } else {
    writeFileSync(envPath, content.trimEnd() + `\nAPI_KEY=${key}\n`);
    console.log("Added API_KEY to .env");
  }
} else {
  console.log(".env not found — key not saved");
}
