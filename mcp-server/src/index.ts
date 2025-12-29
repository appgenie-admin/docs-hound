#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMCPServer } from './mcp-handler.js'

// Start the server
async function main() {
  // Set MCP mode to suppress info logs from dependencies
  process.env.MCP_MODE = 'true'

  console.error('[MCP Server] Starting Docs Hound MCP Server (stdio mode)...')

  const server = createMCPServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('[MCP Server] Connected and ready')
}

main().catch((error) => {
  console.error('[MCP Server] Fatal error:', error)
  process.exit(1)
})
