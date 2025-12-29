#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { searchDocs } from '@docs-hound/tool-docs-search'
import { getSiteRegistry } from '@docs-hound/shared-db'

// Create the MCP server
const server = new Server(
  {
    name: 'docs-hound',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
)

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
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
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'search_docs': {
        const query = (args as { query: string }).query
        const source = (args as { source?: string }).source
        const limit = (args as { limit?: number }).limit || 5

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
        const domain = (args as { domain: string }).domain
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const registry = getSiteRegistry()
  const sites = await registry.listSites()

  const resources = [
    {
      uri: 'docs://sources',
      name: 'All Documentation Sources',
      description: 'List of all indexed documentation sites',
      mimeType: 'application/json',
    },
    ...sites.map((site) => ({
      uri: `docs://sources/${site.domain}`,
      name: site.name,
      description: site.description || `Documentation from ${site.domain}`,
      mimeType: 'application/json',
    })),
  ]

  return { resources }
})

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params

  if (uri === 'docs://sources') {
    const registry = getSiteRegistry()
    const sites = await registry.listSites()

    return {
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
    }
  }

  throw new Error(`Unknown resource: ${uri}`)
})

// Start the server
async function main() {
  console.error('[MCP Server] Starting Docs Hound MCP Server...')

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('[MCP Server] Connected and ready')
}

main().catch((error) => {
  console.error('[MCP Server] Fatal error:', error)
  process.exit(1)
})
