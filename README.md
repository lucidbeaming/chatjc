# chatjc

A RAG-powered chatbot API that answers questions about a developer's professional background. Built with Hono, LangChain, Mistral AI, and SQLite.

Designed to be embedded on a portfolio website, chatjc loads markdown files describing a developer's skills, experience, projects, and more, then uses retrieval-augmented generation to answer visitor questions conversationally.

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

Test it with the built-in CLI:

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

Returns `{ "status": "ok" }`. No authentication required.

## Configuration

All configuration is via environment variables. See `.env.example` for the full list.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MISTRAL_API_KEY` | Yes | — | Mistral AI API key |
| `API_KEY` | Yes | — | API key for chat endpoint auth |
| `PORT` | No | `3000` | Server port |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `CONTEXT_DIR` | No | `./context/mock` | Path to context markdown files |
| `RATE_LIMIT_MAX` | No | `20` | Max requests per window |
| `MAX_INPUT_LENGTH` | No | `500` | Max user message length (chars) |
| `MAX_RESPONSE_LENGTH` | No | `1000` | Max response length (chars) |

## Testing

```bash
npm test
```

Tests run entirely locally with mocked LLM calls — no API keys needed. The test suite covers the chat endpoint, guardrails, rate limiting, API key auth, database operations, and health check.

## License

Apache 2.0
