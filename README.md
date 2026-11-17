# ShopSavvy MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Give any AI assistant current product prices, price history and buying guides from [ShopSavvy](https://shopsavvy.com), via the [Model Context Protocol](https://modelcontextprotocol.io/).

**No signup and no API key needed.** Anonymous use is rate-limited per IP (10 tool calls per minute, 100 per hour). Add a Data API key for higher limits.

## Two ways to connect

### 1. Remote server (recommended)

ShopSavvy hosts the server. Clients that support remote MCP servers connect by URL, with nothing to install:

```
https://api.shopsavvy.com/mcp
```

That's the Streamable HTTP endpoint. Older clients that only speak the HTTP+SSE transport can use `https://api.shopsavvy.com/mcp/sse`.

#### Per-client install (remote)

All of these use the remote URL, so nothing runs on your machine. No signup and no API key. Setup details for each client also live at **[shopsavvy.com/agents#install](https://shopsavvy.com/agents#install)**.

| Client | How |
|--------|-----|
| **Claude Code** | `claude mcp add --transport http shopsavvy https://api.shopsavvy.com/mcp` (add `--scope user` for every project). Check with `claude mcp list` or `/mcp`. There is also a [plugin with extra skills](https://github.com/shopsavvy/shopsavvy-claude-plugin). |
| **Claude Desktop and claude.ai** | Settings > Connectors > Add custom connector, name it ShopSavvy, paste the URL, no sign-in. Or use the stdio config in section 2 below. |
| **ChatGPT** | Turn on Developer mode (Settings > Security and login), open chatgpt.com/plugins, click +, paste the URL, choose No Authentication. Needs a plan that offers developer mode. |
| **OpenAI Codex** | `codex mcp add shopsavvy --url https://api.shopsavvy.com/mcp` |
| **Gemini CLI** | `gemini mcp add --transport http shopsavvy https://api.shopsavvy.com/mcp`. By hand, put `"shopsavvy": { "httpUrl": "https://api.shopsavvy.com/mcp" }` under `mcpServers` in `~/.gemini/settings.json`. |
| **Cursor** | In `~/.cursor/mcp.json` (or `.cursor/mcp.json`): `{ "mcpServers": { "shopsavvy": { "url": "https://api.shopsavvy.com/mcp" } } }` |
| **VS Code (GitHub Copilot)** | In `.vscode/mcp.json`: `{ "servers": { "shopsavvy": { "type": "http", "url": "https://api.shopsavvy.com/mcp" } } }`, then use Agent mode. |
| **Windsurf (Devin Desktop)** | In `~/.config/devin/mcp_config.json`: `{ "mcpServers": { "shopsavvy": { "serverUrl": "https://api.shopsavvy.com/mcp" } } }` |
| **Anything else** | Streamable HTTP: `https://api.shopsavvy.com/mcp`. HTTP+SSE: `https://api.shopsavvy.com/mcp/sse`. stdio only: section 2 below. |

To confirm it works, ask "What's the best price for AirPods Pro right now?". The answer should end with a source line linking the product page on shopsavvy.com.

If a client can't connect, check the URL first, then open an issue (links at the bottom). Anonymous use is limited to 10 tool calls a minute and 100 an hour per IP; add a key for more (below).

### 2. This package (for stdio-only clients)

Some clients can only launch a local command. This package is that command: a small bridge that relays MCP messages between your client and the hosted server. The tools always match the hosted server, because they come from it.

Requires Node.js 18+.

**Claude Desktop** — add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "shopsavvy": {
      "command": "npx",
      "args": ["-y", "@shopsavvy/mcp-server"]
    }
  }
}
```

Any other stdio client: run `npx -y @shopsavvy/mcp-server`.

## Higher limits with an API key

Get a key at [shopsavvy.com/data](https://shopsavvy.com/data), then:

- **Remote server:** send the header `Authorization: Bearer ss_live_…`
- **This package:** set the `SHOPSAVVY_API_KEY` environment variable:

```json
{
  "mcpServers": {
    "shopsavvy": {
      "command": "npx",
      "args": ["-y", "@shopsavvy/mcp-server"],
      "env": { "SHOPSAVVY_API_KEY": "ss_live_your_key_here" }
    }
  }
}
```

## Tools

| Tool | What it does |
|------|--------------|
| `product_lookup` | Find a product by barcode/UPC/EAN, ASIN, URL, model number or name |
| `product_lookup_batch` | Look up several products at once |
| `product_search` | Keyword search across the catalog |
| `universal_search` | Ranked search with review summaries, good for category queries |
| `product_offers` | Current prices from every retailer |
| `product_offers_retailer` | Current prices from one retailer (e.g. `amazon.com`) |
| `product_price_history` | Price history over a date range |
| `product_schedule` / `product_unschedule` / `scheduled_products_list` | Automatic price monitoring (API key required) |
| `api_usage` | Your API key's usage |
| `content_best_picks` | Curated "best of" buying guides |
| `content_tldr_review` | Pros, cons and a verdict for a product |
| `content_qa_answers` | Answers to common questions about a product |
| `content_buying_guide` | When-to-buy timing advice |

Price answers end with a source line naming ShopSavvy and linking the product page on shopsavvy.com, with the time the latest price was checked, so your assistant can cite where a price came from.

## Try asking

- "What's the best price for AirPods Pro right now?"
- "Show me the price history for B0D1XD1ZV3 over the last month."
- "Best air fryers, and where are they cheapest?"
- "Is now a good time to buy a TV?"

## Development

```bash
git clone https://github.com/shopsavvy/shopsavvy-mcp-server
cd shopsavvy-mcp-server
bun install
bun run build
bun test
```

`SHOPSAVVY_MCP_URL` points the bridge (and its tests) at another deployment of the server.

## Support

- Docs: [shopsavvy.com/agents](https://shopsavvy.com/agents) · [Changelog](CHANGELOG.md) · [More prompts](examples/usage-examples.md)
- Free tools, no install: [UPC lookup](https://shopsavvy.com/tools/upc-lookup) · [QR code generator](https://shopsavvy.com/qr/create)
- Issues: [github.com/shopsavvy/shopsavvy-mcp-server/issues](https://github.com/shopsavvy/shopsavvy-mcp-server/issues)
- Email: hello@greatwork.company

## License

MIT, see [LICENSE](LICENSE).
