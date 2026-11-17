# Changelog

All notable changes to `@shopsavvy/mcp-server` (the stdio bridge) and the hosted server it relays to. The hosted server's tool behavior changes ship on the server and apply to every client at once; those are listed under "Hosted server" with their dates.

## Unreleased

### Hosted server (https://api.shopsavvy.com/mcp)
- 2026-11-09: In-store prices from shopper receipts appear in `product_offers`, listed separately from online offers and labeled user-collected. Warehouse-club in-store prices need a Professional plan or above with a key; anonymous use does not include them.
- 2026-10-12: Price answers end with a source line naming ShopSavvy, linking the product page on shopsavvy.com and giving the time the latest price was checked.
- 2026-10-12: Every tool description says what it returns, when to use it instead of its siblings, which identifiers match best, and its cost with a key (free without one). `product_lookup_batch` results include the ShopSavvy ID.

## 2.0.0 - 2026-09-27

- The package is now a stdio bridge to the hosted server at `https://api.shopsavvy.com/mcp`. The tools always match the hosted server.
- Works without an API key (anonymous use is rate limited per IP). Set `SHOPSAVVY_API_KEY` to send your key and get higher limits.
- Tests drive the built bridge through the official MCP stdio client.
- Added `mcpName` and `server.json` for the MCP registry (2026-10-12).

## 1.0.4 - 2026-04-03

- Last release of the original standalone server that required an API key.

Earlier releases (1.0.0 to 1.0.3, July 2025) are listed on the [releases page](https://github.com/shopsavvy/shopsavvy-mcp-server/releases).
