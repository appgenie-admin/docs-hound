import { Index, type QueryResult } from '@upstash/vector'

interface DocumentMetadata {
  id: string
  url: string
  title: string
  excerpt?: string
  source: string
  scrapedAt: string
}

export interface SearchResult {
  id: string
  content: {
    id: string
    url: string
    title: string
    content: string
    excerpt?: string
    source: string
    scrapedAt: string
  }
  score: number
}

/**
 * Search Upstash Vector for documentation using semantic search
 *
 * @param query - Natural language search query
 * @param source - Optional documentation source (domain) to filter by
 * @param limit - Number of results to return (default: 5)
 */
export async function searchDocs(
  query: string,
  source?: string,
  limit: number = 5
): Promise<SearchResult[]> {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN

  if (!url || !token) {
    console.warn(
      '[SearchClient] Upstash Vector credentials not configured - returning empty results'
    )
    return []
  }

  try {
    const index = new Index({ url, token })

    console.log(
      `[SearchClient] Searching for: "${query}"${source ? ` (source: ${source})` : ' (all sources)'}`
    )

    // Build query options
    const queryOptions: {
      data: string
      topK: number
      includeMetadata: boolean
      includeData: boolean
      filter?: string
    } = {
      data: query, // Natural language query
      topK: limit,
      includeMetadata: true,
      includeData: true, // Include the actual document content
    }

    // Add source filter if specified
    if (source) {
      queryOptions.filter = `source = '${source}'`
    }

    const results = await index.query(queryOptions)

    console.log(`[SearchClient] ✓ Found ${results.length} results`)

    // Log the structure of the first result for debugging
    if (results.length > 0) {
      console.log('[SearchClient] Sample result structure:', {
        id: results[0].id,
        score: results[0].score,
        hasData: !!results[0].data,
        dataType: typeof results[0].data,
        dataLength: results[0].data ? String(results[0].data).length : 0,
        hasMetadata: !!results[0].metadata,
        metadataKeys: results[0].metadata
          ? Object.keys(results[0].metadata)
          : [],
      })
    }

    // Map results to match expected format
    return results.map((hit: QueryResult<Record<string, unknown>>) => ({
      id: String(hit.id),
      content: {
        id: (hit.metadata as unknown as DocumentMetadata).id,
        url: (hit.metadata as unknown as DocumentMetadata).url,
        title: (hit.metadata as unknown as DocumentMetadata).title,
        content: hit.data as string,
        excerpt: (hit.metadata as unknown as DocumentMetadata).excerpt,
        source: (hit.metadata as unknown as DocumentMetadata).source,
        scrapedAt: (hit.metadata as unknown as DocumentMetadata).scrapedAt,
      },
      score: hit.score,
    }))
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error(`[SearchClient] ✗ Search failed:`, err.message)
    throw error
  }
}
