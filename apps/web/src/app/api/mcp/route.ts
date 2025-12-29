import { NextRequest, NextResponse } from 'next/server'
import { searchDocs } from '@docs-hound/tool-docs-search'
import { getSiteRegistry } from '@docs-hound/shared-db'

interface JSONRPCRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

interface JSONRPCResponse {
  jsonrpc: '2.0'
  id?: string | number | null
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

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
    const message = (await request.json()) as JSONRPCRequest

    console.log('[MCP API] Received request:', message.method)

    // Handle the message based on method
    const response = await handleMCPRequest(message)

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

/**
 * Handle MCP JSON-RPC requests
 */
async function handleMCPRequest(
  request: JSONRPCRequest
): Promise<JSONRPCResponse> {
  const { method, params, id } = request

  try {
    switch (method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: 'docs-hound',
              version: '1.0.0',
            },
          },
        }
      }

      case 'tools/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'search_docs',
                description: `Search indexed documentation using semantic search.
Returns relevant documentation excerpts with URLs and source sites.
Can search across all sources or filter by a specific domain.`,
                inputSchema: {
                  type: 'object' as const,
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Natural language search query',
                    },
                    source: {
                      type: 'string',
                      description:
                        'Optional: Domain to search within (e.g., "docs.example.com")',
                    },
                    limit: {
                      type: 'number',
                      description: 'Number of results to return (default: 5)',
                      default: 5,
                    },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'list_sources',
                description: 'List all indexed documentation sources (domains)',
                inputSchema: {
                  type: 'object' as const,
                  properties: {},
                  required: [],
                },
              },
              {
                name: 'get_source_info',
                description: 'Get detailed information about a specific source',
                inputSchema: {
                  type: 'object' as const,
                  properties: {
                    domain: {
                      type: 'string',
                      description: 'Domain of the documentation source',
                    },
                  },
                  required: ['domain'],
                },
              },
            ],
          },
        }
      }

      case 'tools/call': {
        const toolName = (params as { name: string })?.name
        const args =
          (params as { arguments?: Record<string, unknown> })?.arguments || {}

        const result = await handleToolCall(toolName, args)
        return {
          jsonrpc: '2.0',
          id,
          result,
        }
      }

      case 'resources/list': {
        const registry = getSiteRegistry()
        const sites = await registry.listSites()

        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              {
                uri: 'docs://sources',
                name: 'All Documentation Sources',
                description: 'List of all indexed documentation sites',
                mimeType: 'application/json',
              },
              ...sites.map((site) => ({
                uri: `docs://sources/${site.domain}`,
                name: site.name,
                description:
                  site.description || `Documentation from ${site.domain}`,
                mimeType: 'application/json',
              })),
            ],
          },
        }
      }

      case 'resources/read': {
        const uri = (params as { uri: string })?.uri

        if (uri === 'docs://sources') {
          const registry = getSiteRegistry()
          const sites = await registry.listSites()

          return {
            jsonrpc: '2.0',
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(
                    sites.map((s) => ({
                      domain: s.domain,
                      name: s.name,
                      description: s.description,
                      status: s.status,
                      pageCount: s.pageCount,
                      lastIndexedAt: s.lastIndexedAt,
                    })),
                    null,
                    2
                  ),
                },
              ],
            },
          }
        }

        if (uri.startsWith('docs://sources/')) {
          const domain = uri.replace('docs://sources/', '')
          const registry = getSiteRegistry()
          const site = await registry.getSite(domain)

          if (!site) {
            throw new Error(`Source not found: ${domain}`)
          }

          const pages = await registry.getIndexedPages(domain)

          return {
            jsonrpc: '2.0',
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(
                    {
                      domain,
                      ...site,
                      pages,
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          }
        }

        throw new Error(`Unknown resource: ${uri}`)
      }

      default: {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: errorMessage,
      },
    }
  }
}

/**
 * Handle tool calls
 */
async function handleToolCall(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'search_docs': {
      const query = args.query as string
      const source = args.source as string | undefined
      const limit = (args.limit as number) || 5

      const results = await searchDocs(query, source, limit)

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No relevant documentation found for your query.',
            },
          ],
        }
      }

      const formattedResults = results.map((result, index) => {
        const excerpt =
          result.content.content.length > 500
            ? result.content.content.substring(0, 500) + '...'
            : result.content.content

        return `${index + 1}. **${result.content.title}**
   Source: ${result.content.source}
   URL: ${result.content.url}
   Score: ${result.score.toFixed(3)}

   ${excerpt}`
      })

      return {
        content: [
          {
            type: 'text',
            text: `Found ${results.length} relevant documentation pages:\n\n${formattedResults.join('\n\n---\n\n')}`,
          },
        ],
      }
    }

    case 'list_sources': {
      const registry = getSiteRegistry()
      const sites = await registry.listSites()

      if (sites.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No documentation sources indexed yet.',
            },
          ],
        }
      }

      const sourceList = sites
        .filter((s) => s.status === 'indexed')
        .map(
          (site) =>
            `- **${site.name}** (${site.domain})
  Pages: ${site.pageCount}
  Last indexed: ${site.lastIndexedAt ? new Date(site.lastIndexedAt).toLocaleDateString() : 'Never'}
  ${site.description || ''}`
        )

      return {
        content: [
          {
            type: 'text',
            text: `Indexed documentation sources:\n\n${sourceList.join('\n\n')}`,
          },
        ],
      }
    }

    case 'get_source_info': {
      const domain = args.domain as string
      const registry = getSiteRegistry()
      const site = await registry.getSite(domain)

      if (!site) {
        return {
          content: [
            {
              type: 'text',
              text: `No documentation source found for domain: ${domain}`,
            },
          ],
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `**${site.name}** (${domain})

Status: ${site.status}
Base URL: ${site.baseUrl}
Description: ${site.description || 'None'}
Pages indexed: ${site.pageCount}
Last indexed: ${site.lastIndexedAt ? new Date(site.lastIndexedAt).toLocaleString() : 'Never'}
Last discovered: ${site.lastDiscoveredAt ? new Date(site.lastDiscoveredAt).toLocaleString() : 'Never'}
Created: ${new Date(site.createdAt).toLocaleString()}`,
          },
        ],
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// Return 405 for other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send MCP messages.' },
    { status: 405 }
  )
}
