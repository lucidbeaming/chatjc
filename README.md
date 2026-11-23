# chatjc

RAG chatbot API that answers questions about a developer's résumé.

```console
$ curl -s -X POST localhost:3000/api/chat \
    -H 'content-type: application/json' -H "x-api-key: $API_KEY" \
    -d '{"message":"What technologies does this developer work with?"}'
{
  "session_id": "9b2c065a-856d-4ba2-b019-91ae5ead4ab2",
  "response": "The developer works with a variety of technologies across backend, database, ML, DevOps, and testing domains. Key technologies include Node.js, TypeScript, Python, FastAPI, Django, PostgreSQL, Redis, Docker, Kubernetes, and tools like LangChain, Mistral AI, and SQLite. For a full list, refer to their project portfolio and experience sections.",
  "timestamp": "2026-11-23T20:04:18.792Z"
}
```

(A real answer from `mistral-small-latest` over the bundled mock context. It runs live as the chatbot on [joshuacurry.dev](https://joshuacurry.dev/chatjc).)

A RAG-powered chatbot API that answers questions about a developer's professional background. Built with Hono, LangChain, Mistral AI, and SQLite.

Designed to be embedded on a portfolio website, chatjc loads markdown files describing a developer's skills, experience, projects, and more, then uses retrieval-augmented generation to answer visitor questions conversationally.

## Requirements

- Node.js 22+
- A [Mistral](https://console.mistral.ai) or [OpenAI](https://platform.openai.com/api-keys) API key, depending on `LLM_BACKEND`

## Quick start

```bash
git clone https://github.com/lucidbeaming/chatjc.git
cd chatjc
npm install
cp .env.example .env
```

Set `MISTRAL_API_KEY` in `.env` (get one at [console.mistral.ai](https://console.mistral.ai)), then generate an API key for the chat endpoint:

```bash
npm run generate-key
```

Start the dev server:

```bash
npm run dev
```

Test it with the built-in CLI, which talks to `http://localhost:$PORT` (set `API_URL` to reach another host):

```bash
npm run chat
```

## Adding your own context

The chatbot's knowledge comes entirely from markdown files in the `context/` directory. To make it answer questions about you, replace the mock files with your own.

### Context directory structure

```
context/
├── mock/           # Anonymized sample data (default, safe for demos)
└── live/           # Your real data (gitignored, used in production)
```

Set which directory the chatbot reads from in `.env`:

```env
CONTEXT_DIR=./context/mock    # default — sample data
CONTEXT_DIR=./context/live    # your real data
```

### Writing context files

Each `.md` file in the context directory becomes part of the chatbot's knowledge base. The chatbot can only answer based on what's in these files — it has no other information about you.

The included mock files cover these topics and serve as templates:

| File | Purpose |
|---|---|
| `about.md` | Bio, current focus, career narrative, working style, links |
| `experience.md` | Job history with titles, companies, dates, and descriptions |
| `skills.md` | Technical skills grouped by category |
| `code.md` | Project portfolio with tech stacks and descriptions |
| `endorsements.md` | Recommendations or testimonials from colleagues |
| `awards.md` | Awards, honors, recognition |
| `volunteering.md` | Volunteer work and community involvement |
| `writing.md` | Published writing, blog posts, documentation |
| `chatbot.md` | How this chatbot works (so it can explain itself) |

You don't need all of these. Use whichever are relevant to you and delete or leave empty the ones that aren't. You can also add new files — any `.md` file in the context directory will be loaded automatically.

### Tips for writing effective context

**Be specific.** The chatbot retrieves chunks of text by similarity to the user's question. Concrete details like dates, company names, project descriptions, and skill names produce better matches than vague summaries.

**Use clear headings.** The text splitter uses markdown headings (`##`, `###`) as natural boundaries. Each section under a heading becomes a retrievable chunk.

**Write in the third person.** The system prompt refers to "the developer" — writing context in third person ("Alex built a data pipeline...") produces more natural responses than first person.

**Keep individual files focused.** One topic per file works better than one massive document. The retriever selects the top chunks by relevance, so focused files mean less irrelevant context in the prompt.

**Include what you want asked about.** If you want the chatbot to answer questions about your open source work, write a detailed `code.md`. If you want it to discuss your career trajectory, flesh out `about.md` with narrative context, not just facts.

### Example: minimal setup

At minimum, you need an `about.md` and a `skills.md`:

```markdown
<!-- context/live/about.md -->
# About Alex

Alex is a backend developer based in Denver, CO with 6 years of experience
building APIs and data systems. Currently looking for senior roles at
climate-focused startups.

## Links
- GitHub: https://github.com/example
- Portfolio: https://example.dev
```

```markdown
<!-- context/live/skills.md -->
# Skills

## Backend
- Python, Go, TypeScript
- Django, FastAPI, Express

## Infrastructure
- AWS, Docker, Terraform
- PostgreSQL, Redis
```

### Tuning retrieval

If the chatbot isn't finding the right context for questions, adjust these values in `.env`:

```env
RAG_CHUNK_SIZE=1000       # characters per chunk (larger = more context per chunk)
RAG_CHUNK_OVERLAP=200     # overlap between chunks (higher = fewer lost boundaries)
RAG_TOP_K=4               # number of chunks retrieved per question
```

Smaller chunks with higher `RAG_TOP_K` give more precise retrieval. Larger chunks with lower `RAG_TOP_K` give more surrounding context per match.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run chat` | CLI chat client |
| `npm run generate-key` | Generate and save an API key |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## API

### `POST /api/chat`

Send a message and get a response.

**Headers:**
- `Content-Type: application/json`
- `x-api-key: your-api-key`

**Body:**
```json
{
  "message": "What technologies does this developer work with?",
  "session_id": "optional-uuid-from-previous-response",
  "source": "api"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "response": "Based on their background...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Sessions maintain conversation history. Omit `session_id` to start a new conversation, or include one from a previous response to continue it.

### `GET /api/health`

Returns `{ "status": "ok", "version": "1.1.4", "timestamp": "..." }`. No authentication required.

### `GET /api/doc` and `GET /api/docs`

The OpenAPI 3 document (JSON) and a Swagger UI for it. Both require the `x-api-key` header.

## Configuration

All configuration is via environment variables (`.env` is loaded at startup). `.env.example` has every variable.

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_KEY` | Yes | — | API key for the chat and docs endpoints (`npm run generate-key`) |
| `LLM_BACKEND` | No | `mistral-langchain` | Which model provider answers; see [LLM backends](#llm-backends) |
| `MISTRAL_API_KEY` | With `mistral-langchain` | — | Mistral AI API key |
| `OPENAI_API_KEY` | With `openai-*` | — | OpenAI API key |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `127.0.0.1` | Bind address (`0.0.0.0` to listen on all interfaces) |
| `DB_PATH` | No | `./data/chatjc.db` | SQLite database for sessions and messages; the folder is created if missing |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn` or `error` |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `RATE_LIMIT_MAX` | No | `20` | Max chat requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate-limit window in ms |
| `MAX_INPUT_LENGTH` | No | `500` | Max user message length (chars) |
| `MAX_RESPONSE_LENGTH` | No | `2000` | Responses are truncated to this many characters |
| `MAX_RESPONSE_TOKENS` | No | `600` | Max tokens the model may generate |
| `MISTRAL_CHAT_MODEL` | No | `mistral-small-latest` | Chat model for `mistral-langchain` |
| `MISTRAL_EMBED_MODEL` | No | `mistral-embed` | Embeddings model for `mistral-langchain` |
| `OPENAI_CHAT_MODEL` | No | `gpt-4.1-mini` | Chat model for the `openai-*` backends |
| `OPENAI_EMBED_MODEL` | No | `text-embedding-3-small` | Embeddings model for the `openai-*` backends |
| `CONTEXT_DIR` | No | `./context/mock` | Folder of context Markdown files |
| `RAG_CHUNK_SIZE` | No | `1000` | Characters per chunk |
| `RAG_CHUNK_OVERLAP` | No | `200` | Overlap between chunks |
| `RAG_TOP_K` | No | `4` | Chunks retrieved per question |
| `API_URL` | No | `http://localhost:$PORT` | Server URL for `npm run chat` only |

### LLM backends

| `LLM_BACKEND` | Chat | Embeddings | Needs |
|---|---|---|---|
| `mistral-langchain` (default) | Mistral via LangChain | Mistral | `MISTRAL_API_KEY` |
| `openai-langchain` | OpenAI via LangChain | OpenAI | `OPENAI_API_KEY` |
| `openai-responses` | OpenAI Responses API, called directly | OpenAI (via LangChain) | `OPENAI_API_KEY` |

That's why `package.json` includes both the Mistral and OpenAI SDKs: each one is used by at least one backend. The server refuses to start if the key for the selected backend is missing.

## How it works

1. **Startup:** every `.md` file in `CONTEXT_DIR` is split into overlapping chunks (`RAG_CHUNK_SIZE` / `RAG_CHUNK_OVERLAP`), embedded, and kept in an in-memory vector store.
2. **Request:** `POST /api/chat` passes API-key auth, CSRF protection and the rate limiter. The input is then normalized and checked against prompt-injection patterns.
3. **Retrieval:** the `RAG_TOP_K` most similar chunks are retrieved by cosine similarity and passed to the model with the session's earlier messages and a system prompt that limits answers to the context.
4. **Response:** the output is checked and truncated to `MAX_RESPONSE_LENGTH`, and both sides of the exchange are stored in SQLite under the session ID.

Source layout: `src/routes` (HTTP), `src/middleware` (auth, rate limit, security), `src/services` (`rag.ts`, `llm.ts`, `guardrails.ts`), `src/db` (SQLite).

## Testing

```bash
npm test
```

Tests run entirely locally with mocked LLM calls — no API keys needed. The test suite covers the chat endpoint, guardrails, rate limiting, API key auth, database operations, and health check.

## Related projects

- [joshuacurry.dev](https://joshuacurry.dev/chatjc): where chatjc runs as the site's chatbot
- [generatejsonld](https://github.com/lucidbeaming/generatejsonld): crawls a site and generates Schema.org JSON-LD with Mistral
- [alt-tagger](https://github.com/lucidbeaming/alt-tagger): generates image alt text with a vision model

## License

[MIT](LICENSE). Releases before this change were published under Apache-2.0, and those copies keep that license.
