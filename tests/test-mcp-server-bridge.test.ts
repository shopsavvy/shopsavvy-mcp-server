// Drives the BUILT package (dist/index.js, what `npx @shopsavvy/mcp-server`
// runs) through the official MCP stdio client, against the real hosted server.
// Set SHOPSAVVY_MCP_URL to target another deployment of the same server.
// Run `bun run build` first.

import { describe, expect, test } from "bun:test"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

const bridgeEnv = (extra: Record<string, string> = {}) => {
  const env: Record<string, string> = { PATH: process.env.PATH ?? "" }
  if (process.env.SHOPSAVVY_MCP_URL) env.SHOPSAVVY_MCP_URL = process.env.SHOPSAVVY_MCP_URL
  return { ...env, ...extra }
}

describe("stdio bridge", () => {
  test("anonymous: handshake, tool list and a real tool call", async () => {
    const client = new Client({ name: "bridge-test", version: "1.0.0" })
    await client.connect(new StdioClientTransport({ command: "node", args: ["dist/index.js"], env: bridgeEnv(), stderr: "pipe" }))
    try {
      expect(client.getServerVersion()?.name).toBe("shopsavvy")
      const { tools } = await client.listTools()
      const names = tools.map((tool) => tool.name)
      expect(names).toContain("product_search")
      expect(names).toContain("product_offers")
      const result: any = await client.callTool({ name: "product_search", arguments: { query: "airpods pro", limit: 2 } })
      expect(result.isError).toBeFalsy()
      expect(result.content[0].text).toContain("Search Results")
    } finally {
      await client.close()
    }
  }, 90000)

  test("a malformed SHOPSAVVY_API_KEY fails fast with a readable message on stderr", async () => {
    const proc = Bun.spawn(["node", "dist/index.js"], { env: bridgeEnv({ SHOPSAVVY_API_KEY: "not-a-key" }), stdin: "pipe", stdout: "pipe", stderr: "pipe" })
    const code = await proc.exited
    expect(code).toBe(1)
    expect(await new Response(proc.stderr).text()).toContain("isn't a valid key")
    expect(await new Response(proc.stdout).text()).toBe("")
  }, 30000)
})
