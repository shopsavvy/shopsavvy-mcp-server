#!/usr/bin/env node
// ShopSavvy MCP server for stdio-only MCP clients.
//
// This is a bridge, not a second implementation: it relays JSON-RPC between
// the client's stdio and ShopSavvy's hosted MCP server
// (https://api.shopsavvy.com/mcp, Streamable HTTP). The tools, their schemas
// and their answers all come from the hosted server, so this package can't
// drift from it. Clients that speak remote MCP directly (Claude Code, Cursor,
// VS Code, Codex, Gemini CLI, Windsurf, claude.ai, ChatGPT) don't need this
// package at all — point them at the URL.
//
// No API key is required. Anonymous use is rate-limited per IP; set
// SHOPSAVVY_API_KEY to use your Data API key's higher limits.
//
// stdout carries the MCP protocol, so every log line goes to stderr.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "node:fs"

const DEFAULT_URL = "https://api.shopsavvy.com/mcp"

const log = (message: string) => process.stderr.write(`[shopsavvy-mcp] ${message}\n`)

const packageVersion = (): string => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
  return pkg.version
}

const main = async () => {
  const url = new URL(process.env.SHOPSAVVY_MCP_URL || DEFAULT_URL)
  const apiKey = process.env.SHOPSAVVY_API_KEY?.trim()

  if (apiKey && !/^ss_(live|test)_[a-zA-Z0-9]{32}$/.test(apiKey)) {
    log("SHOPSAVVY_API_KEY is set but isn't a valid key (expected ss_live_… or ss_test_… followed by 32 characters). Unset it to use the free anonymous tier, or copy your key again from https://shopsavvy.com/data.")
    process.exit(1)
  }

  const headers: Record<string, string> = { "User-Agent": `shopsavvy-mcp-server/${packageVersion()}` }
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const remote = new StreamableHTTPClientTransport(url, { requestInit: { headers } })
  const local = new StdioServerTransport()

  let closing = false
  const shutdown = async (code: number) => {
    if (closing) return
    closing = true
    await Promise.allSettled([remote.close(), local.close()])
    process.exit(code)
  }

  local.onmessage = (message: JSONRPCMessage) => {
    remote.send(message).catch((error: Error) => {
      log(`request to ${url.origin} failed: ${error.message}`)
      // Answer the client's request instead of leaving it waiting forever.
      if ("id" in message && message.id !== undefined && "method" in message) {
        local.send({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32603, message: `Couldn't reach ShopSavvy (${url.origin}): ${error.message}` },
        })
      }
    })
  }
  remote.onmessage = (message: JSONRPCMessage) => {
    local.send(message).catch((error: Error) => log(`writing to client failed: ${error.message}`))
  }

  local.onclose = () => { shutdown(0) }
  remote.onerror = (error: Error) => log(`remote error: ${error.message}`)
  local.onerror = (error: Error) => log(`stdio error: ${error.message}`)

  process.on("SIGINT", () => { shutdown(0) })
  process.on("SIGTERM", () => { shutdown(0) })

  await remote.start()
  await local.start()
  log(`connected to ${url.origin}${url.pathname} (${apiKey ? "API key" : "anonymous, rate-limited"})`)
}

main().catch((error: Error) => {
  log(`failed to start: ${error.message}`)
  process.exit(1)
})
