# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Relicensed from Apache-2.0 to MIT; earlier releases keep Apache-2.0 (#20)
- Package metadata: `repository`, `bugs` and `homepage` in `package.json` (#20)
- Requires Node 22 or newer (`engines.node`), as better-sqlite3 13 and openai 7 do (#16)
- @hono/node-server 2, openai 7, dotenv 18, uuid 14, better-sqlite3 13; hono, zod, LangChain and the Hono plugins updated within their majors (#16)
- Dev toolchain: vitest 5, tsup 9, TypeScript 6.0, @types/node 26 (#16)
- Removed `@types/uuid`; uuid ships its own types (#16)
- Source formatted with Prettier (#16)

### Fixed
- Server no longer crashes on first start when the `data/` folder for the SQLite DB doesn't exist (#18)
- Truncation test matches the 2000-character response limit (#16)

### Security
- Resolved 1 critical and 12 high npm advisories (#16)

## [1.1.4] - 2026-03-09

See the [v1.1.4 release](https://github.com/lucidbeaming/chatjc/releases/tag/v1.1.4).
