# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- README: sample response, requirements, LLM backends, How it works, `/api/doc` and `/api/docs`, related projects (#26)

### Changed
- Relicensed from Apache-2.0 to MIT; earlier releases keep Apache-2.0 (#20)
- Package metadata: `repository`, `bugs` and `homepage` in `package.json` (#20)
- Requires Node 22 or newer (`engines.node`), as better-sqlite3 13 and openai 7 do (#16)
- @hono/node-server 2, openai 7, dotenv 18, uuid 14, better-sqlite3 13; hono, zod, LangChain and the Hono plugins updated within their majors (#16)
- Dev toolchain: vitest 5, tsup 9, TypeScript 6.0, @types/node 26 (#16)
- Removed `@types/uuid`; uuid ships its own types (#16)
- Source formatted with Prettier (#16)

### Fixed
- The OpenAPI document reports the package version instead of a hard-coded `1.1.2` (#28)
- README configuration table matches `src/config`: `MAX_RESPONSE_LENGTH` is 2000, and the 15 missing variables are listed (#26)
- `npm run chat` talks to the local server on `PORT` (default 3000) instead of a hard-coded port 9003; `API_URL` still overrides it (#24)
- `.gitignore` aligned with the portfolio's common block: Windows thumbnails, Sublime workspaces, shared `.vscode/extensions.json` (#22)
- Server no longer crashes on first start when the `data/` folder for the SQLite DB doesn't exist (#18)
- Truncation test matches the 2000-character response limit (#16)

### Security
- Resolved 1 critical and 12 high npm advisories (#16)

## [1.1.4] - 2026-03-09

See the [v1.1.4 release](https://github.com/lucidbeaming/chatjc/releases/tag/v1.1.4).
