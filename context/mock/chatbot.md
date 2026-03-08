# About This Chatbot

## What Is It

This chatbot is an AI-powered assistant embedded on the developer's portfolio website. It answers questions about the developer's professional background, skills, work history, and projects. It can also explain how it was built. The source code is publicly available on GitHub at https://github.com/lucidbeaming/chatjc.

## How It Works

The chatbot uses Retrieval-Augmented Generation (RAG). When a user asks a question, the system retrieves relevant information from a set of markdown documents about the developer, then sends that context along with the question to a large language model (LLM) to generate a response.

### The RAG Pipeline

1. At startup, markdown files from the `context/` directory are loaded and split into smaller chunks using LangChain's RecursiveCharacterTextSplitter.
2. Each chunk is converted into a numerical embedding using Mistral AI's embedding model and stored in an in-memory vector store.
3. When a user sends a message, the question is embedded and compared against stored chunks using cosine similarity to find the most relevant context.
4. The top matching chunks are injected into a prompt template alongside the user's question and conversation history, then sent to Mistral AI's chat model to generate a response.

### Tech Stack

- **Runtime**: Node.js with TypeScript (ESM)
- **API Framework**: Hono with `@hono/node-server`
- **LLM Provider**: Mistral AI (chat completions and embeddings via `@langchain/mistralai`)
- **Orchestration**: LangChain (document loading, text splitting, prompt templates, LCEL chains)
- **Database**: SQLite via `better-sqlite3` in WAL mode for storing conversation history organized by session
- **Build Tool**: tsup for production builds
- **Testing**: Vitest with mocked LLM calls
- **Logging**: Pino (with pino-pretty in development)

### Security and Privacy

- **API Key Authentication**: All chat requests require a valid API key sent via the `x-api-key` header.
- **Rate Limiting**: Requests are rate-limited per API key to prevent abuse.
- **Input Guardrails**: User messages are checked for prompt injection attempts using pattern matching with Unicode normalization. Input is also sanitized to strip HTML tags and control characters. Messages are validated both before and after sanitization.
- **Session Binding**: Chat sessions are bound to the API key that created them, preventing session enumeration or hijacking.
- **CORS and CSRF**: Cross-origin requests are restricted to the configured origin. POST requests from unrecognized origins are blocked.
- **Secure Headers**: Standard security headers are applied to all responses.
- **Privacy Controls**: In production, user messages and LLM responses are not written to server logs. Only metadata (session ID, message length) is logged. Full message content is stored in SQLite for session continuity only.
- **Context Sanitization**: RAG context documents are sanitized at load time to strip control characters.

### Architecture

The app follows a straightforward layered architecture:

- `src/app.ts` — Hono app with middleware stack (CORS, secure headers, CSRF, API key auth, rate limiting, request logging) and route registration
- `src/routes/chat.ts` — POST `/api/chat` endpoint handling input validation, session management, RAG queries, and response formatting
- `src/services/rag.ts` — RAG pipeline initialization and query execution
- `src/services/guardrails.ts` — Input validation (injection detection, length limits) and output truncation
- `src/db/` — SQLite database client, migrations, and repository functions for sessions and messages
- `src/middleware/` — Authentication, rate limiting, CSRF protection, security headers, and request logging
- `src/config/` — Zod-validated environment configuration
- `context/` — Markdown files loaded as RAG knowledge base at startup

### How to Run It

The project is open source at https://github.com/lucidbeaming/chatjc. Clone the repository, copy `.env.example` to `.env`, set the required API keys, and run `npm run dev` to start the development server. Tests can be run with `npm test` — no API keys are needed for testing since LLM calls are mocked.
