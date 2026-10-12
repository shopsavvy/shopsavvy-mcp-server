# AGENTS.md

Context for coding agents (Claude Code, Codex, Cursor, Copilot and others) working in this repository. Humans: see README.md and CONTRIBUTING.md.

## Overview

`@shopsavvy/mcp-server` is a stdio bridge to ShopSavvy's hosted MCP server at `https://api.shopsavvy.com/mcp` (Streamable HTTP; `/mcp/sse` for HTTP+SSE clients). It relays JSON-RPC between a stdio-only MCP client and the hosted server. It is not a second implementation: the 15 tools, their schemas and their answers all come from the hosted server, so a change to what a tool does belongs there, not here.

- No API key is needed. Anonymous use is limited per IP (10 tool calls a minute, 100 an hour). `SHOPSAVVY_API_KEY` raises it to 100 a minute with no hourly cap, and tool calls then use the key's Data API credits.
- `SHOPSAVVY_MCP_URL` points the bridge at another deployment (used by tests).
- Per-client setup: https://shopsavvy.com/agents#install. Data API docs: https://shopsavvy.com/data/documentation
- MCP registry entry: `server.json` (`io.github.shopsavvy/shopsavvy-mcp-server`), matching `mcpName` in `package.json`.

## Layout

- `src/index.ts`: the whole bridge (stdio transport in, Streamable HTTP client out, key validation, User-Agent)
- `tests/test-mcp-server-bridge.test.ts`: drives the built `dist/index.js` through the official MCP stdio client against the hosted server
- `server.json`: MCP registry metadata (npm stdio package plus the two remotes)
- `examples/`: client config and usage examples
- `test.sh`: `--integration` runs live REST checks with `SHOPSAVVY_API_KEY`

## Commands

```bash
bun install
bun run build      # tsc -> dist/
bun test           # needs network: talks to the hosted server, no key required
./test.sh --integration   # optional, needs SHOPSAVVY_API_KEY, uses credits
```

Build before testing: the tests run `dist/index.js`, not the source.

## Code conventions

- stdout carries the MCP protocol. Every log line goes to stderr (`log()` in `src/index.ts`). A stray `console.log` corrupts the stream.
- Keep the bridge thin: relay messages, set headers, validate the key format, exit with a clear stderr message on misconfiguration. No tool logic, no caching, no rewriting of tool results.
- The key format is `ss_live_` or `ss_test_` followed by 32 characters. Reject a malformed key loudly rather than silently falling back to anonymous.
- Keep `package.json` `version`, `server.json` `version` and the npm package version in `server.json.packages` equal.
- TypeScript, ES modules, Node 18+ compatible (the published package runs under `npx`).

## Testing

- `bun test` exercises the real bridge end to end against the hosted server: initialize, `tools/list`, and real tool calls. Do not replace it with mocks; the point is to catch drift between the bridge and the server.
- Tests run without a key. Never add a real key to a test or fixture.

## What NOT to do

- **Never commit an API key, token or password.** This repo is public. Read keys from `SHOPSAVVY_API_KEY` only.
- Don't add tools, tool descriptions or schemas here; they come from the hosted server.
- Don't write to stdout outside the transport.
- Don't put plan prices, plan names, dollar amounts or credit costs in the README; link to https://shopsavvy.com/data.
- Don't add claims about scale, uptime or customers. Approved wording: "30M+ products", "tens of thousands of retailers", "price history back to 2011".
- Don't publish to npm or the MCP registry from an agent session. Prepare the version bump; a maintainer publishes.
