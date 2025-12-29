import { NextRequest, NextResponse } from 'next/server'
import {
  createMCPServer,
  type JSONRPCMessage,
} from '@docs-hound/mcp-server/src/mcp-handler'

/**
 * Hosted MCP Server endpoint
 * Accepts MCP JSON-RPC messages over HTTP POST with API key authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check API key authentication
    const authHeader = request.headers.get('authorization')
    const expectedApiKey = process.env.MCP_API_KEY

    if (!expectedApiKey) {
      console.error('[MCP API] MCP_API_KEY not configured')
      return NextResponse.json(
        { error: 'MCP server not configured' },
        { status: 500 }
      )
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const providedApiKey = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (providedApiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Parse the JSON-RPC message
    const message = (await request.json()) as JSONRPCMessage

    // Create a server instance for this request
    const server = createMCPServer()

    // Handle the message and get response
    const response = await new Promise<JSONRPCMessage>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'))
      }, 30000) // 30 second timeout

      // Create a minimal transport-like interface
      const transport = {
        start: async () => Promise.resolve(),
        send: async (msg: JSONRPCMessage) => {
          clearTimeout(timeout)
          resolve(msg)
          return Promise.resolve()
        },
        close: async () => Promise.resolve(),
      }

      // Connect the server and handle the message
      server
        .connect(transport)
        .then(() => {
          // Access the internal message handler
          // The server needs to receive the message to process it
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(server as any)._messageHandler?.(message)
        })
        .catch(reject)
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[MCP API] Error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: errorMessage,
        },
        id: null,
      },
      { status: 500 }
    )
  }
}

// Return 405 for other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send MCP messages.' },
    { status: 405 }
  )
}
