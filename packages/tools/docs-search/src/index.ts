import { tool } from 'ai'
import { z } from 'zod'
import { searchDocs, type SearchResult } from './lib/search-client'

export { searchDocs }
export type { SearchResult }

const searchDocsSchema = z.object({
  query: z
    .string()
    .describe(
      'Natural language search query (e.g., "How do I configure authentication?", "API endpoints for users")'
    ),
  source: z
    .string()
    .optional()
    .describe(
      'Optional: Domain/source to search within (e.g., "docs.example.com"). Leave empty to search all sources.'
    ),
  limit: z
    .number()
    .optional()
    .default(5)
    .describe('Number of results to return (default: 5)'),
})

/**
 * Tool for searching documentation using semantic search
 * Powered by Upstash Vector with embeddings
 */
export const searchDocsTool = tool({
  description: `Search indexed documentation using semantic search.
Use this when you need to find information in the indexed documentation sites.
Returns relevant documentation excerpts with URLs and source sites.

You can search across all indexed documentation or filter by a specific source (domain).`,
  inputSchema: searchDocsSchema,
  execute: async ({ query, source, limit = 5 }) => {
    try {
      console.log(
        `[Tool:searchDocs] Searching for: "${query}"${source ? ` in ${source}` : ''}`
      )

      const results = await searchDocs(query, source, limit)

      if (results.length === 0) {
        console.log('[Tool:searchDocs] No results found')
        return {
          success: true,
          results: [],
          message: 'No relevant documentation found for your query.',
          query,
          source,
        }
      }

      console.log(`[Tool:searchDocs] ✓ Returning ${results.length} results`)

      return {
        success: true,
        query,
        source,
        results: results.map((hit) => {
          // Safe access to content with fallbacks
          const content = hit.content?.content || hit.content?.excerpt || ''
          const excerpt =
            content.length > 500 ? content.substring(0, 500) + '...' : content

          return {
            title: hit.content?.title || 'Untitled',
            url: hit.content?.url || '',
            source: hit.content?.source || '',
            excerpt,
            relevanceScore: hit.score,
          }
        }),
        message: `Found ${results.length} relevant documentation page(s)`,
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error('[Tool:searchDocs] ✗ Error:', err.message)
      return {
        success: false,
        error: err.message,
        message: `Failed to search documentation: ${err.message}`,
        query,
        source,
      }
    }
  },
})
