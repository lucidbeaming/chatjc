# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

chatjc is an MCP server powering a chatbot on joshuacurry.dev that answers questions about the developer's skills and job history. It's a REST API built with Hono + TypeScript (ESM), using LangChain with Mistral AI for RAG-based responses, and SQLite for interaction storage.

## Commands

- `npm run dev` — Start dev server with hot reload (tsx watch)
- `npm run build` — Production build (tsup)
- `npm run start` — Run production build
- `npm test` — Run all tests (vitest)
- `npm run test:watch` — Run tests in watch mode

## Architecture

- **API**: Hono framework with `@hono/node-server` adapter
- **LLM**: Mistral AI via `@langchain/mistralai` (chat + embeddings)
- **RAG Pipeline** (`src/services/rag.ts`): Loads markdown from `context/`, splits with RecursiveCharacterTextSplitter, embeds into an in-memory vector store, retrieves via LCEL chain
- **Database**: `better-sqlite3` with WAL mode. Single `messages` table with `session_id` column (not table-per-session). Schema in `src/db/migrations.ts`
- **Guardrails** (`src/services/guardrails.ts`): Prompt injection regex detection, input length cap, HTML stripping, response length truncation
- **Middleware**: CORS, secure headers, IP-based rate limiting (in-memory), request logging (pino)

## Key Files

- `src/app.ts` — Hono app with middleware and route registration
- `src/index.ts` — Server startup (init DB, init RAG, serve)
- `src/routes/chat.ts` — `POST /api/chat` endpoint
- `src/config/index.ts` — Zod-validated env config (lazy-loaded for test compatibility)
- `context/` — Markdown files loaded as RAG context at startup

## Testing

Tests use vitest with Hono's `app.request()` test client. LLM calls are mocked via `vi.mock()`. Database tests use `:memory:` SQLite. Test env vars are set in `tests/setup.ts` — no API key needed to run tests.

## Configuration

Copy `.env.example` to `.env` and set `MISTRAL_API_KEY`. All other vars have defaults.

## Branch Strategy

- `main` is the primary branch for PRs
- `dev` is the active development branch
