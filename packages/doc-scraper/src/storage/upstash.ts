import { Index } from '@upstash/vector'

export interface DocumentMetadata {
  id: string
  url: string
  title: string
  content: string
  excerpt?: string
  /** Domain/source of the documentation site */
  source: string
  scrapedAt: string
}

export interface StorageStats {
  totalDocuments: number
}

export interface SearchResult {
  id: string
  data: DocumentMetadata
  score: number
}

/**
 * Upstash Vector storage layer for documentation
 *
 * Uses a single index with source filtering for all documentation sites
 */
export class UpstashDocStorage {
  private index: Index

  constructor() {
    const url = process.env.UPSTASH_VECTOR_REST_URL
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN

    if (!url || !token) {
      throw new Error(
        'Missing required environment variables: UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN'
      )
    }

    this.index = new Index({
      url,
      token,
    })

    console.log('[UpstashStorage] Initialized with Upstash Vector')
  }

  /**
   * Upsert documents in batches
   */
  async upsertDocuments(
    documents: DocumentMetadata[],
    source: string
  ): Promise<void> {
    if (documents.length === 0) {
      console.log('[UpstashStorage] No documents to upsert')
      return
    }

    console.log(
      `[UpstashStorage] Upserting ${documents.length} documents for ${source}...`
    )

    // Upstash Vector upserts data with text that gets auto-embedded
    const batchSize = 100

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)

      try {
        // Format for Upstash Vector: array of { id, data, metadata }
        const formatted = batch.map((doc) => ({
          id: this.hashUrl(doc.url),
          data: doc.content, // The text to embed
          metadata: {
            id: doc.id,
            url: doc.url,
            title: doc.title,
            excerpt: doc.excerpt,
            source: doc.source,
            scrapedAt: doc.scrapedAt,
          },
        }))

        await this.index.upsert(formatted)

        console.log(
          `[UpstashStorage] ✓ Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)} (${batch.length} docs)`
        )
      } catch (error: unknown) {
        const err = error as { message?: string }
        console.error(`[UpstashStorage] ✗ Failed to upsert batch:`, err.message)
        throw error
      }
    }

    console.log(
      `[UpstashStorage] ✓ Successfully upserted ${documents.length} documents`
    )
  }

  /**
   * Search documents with vector similarity
   * Can search across all sources or filter by specific source
   */
  async searchDocs(
    query: string,
    source?: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    console.log(
      `[UpstashStorage] Searching for: "${query}" (limit: ${limit}${source ? `, source: ${source}` : ', all sources'})`
    )

    try {
      // Build query options
      const queryOptions: {
        data: string
        topK: number
        includeMetadata: boolean
        filter?: string
      } = {
        data: query,
        topK: limit,
        includeMetadata: true,
      }

      // Add source filter if specified
      if (source) {
        queryOptions.filter = `source = '${source}'`
      }

      const results = await this.index.query(queryOptions)

      console.log(`[UpstashStorage] ✓ Found ${results.length} results`)

      return results.map((hit) => ({
        id: hit.id as string,
        data: {
          id: (hit.metadata?.id as string) || '',
          url: (hit.metadata?.url as string) || '',
          title: (hit.metadata?.title as string) || '',
          content: '', // We don't store full content in metadata
          excerpt: (hit.metadata?.excerpt as string) || undefined,
          source: (hit.metadata?.source as string) || source || '',
          scrapedAt:
            (hit.metadata?.scrapedAt as string) || new Date().toISOString(),
        },
        score: hit.score,
      }))
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error(`[UpstashStorage] ✗ Search failed:`, err.message)
      throw error
    }
  }

  /**
   * Delete documents by source (domain)
   */
  async deleteBySource(source: string): Promise<void> {
    console.log(`[UpstashStorage] Deleting documents for source: ${source}...`)

    try {
      // Query all documents for this source
      const results = await this.index.query({
        data: '', // Empty query to get all
        topK: 10000, // Get as many as possible
        includeMetadata: true,
        filter: `source = '${source}'`,
      })

      if (results.length === 0) {
        console.log(`[UpstashStorage] No documents found for source: ${source}`)
        return
      }

      // Delete by IDs
      const ids = results.map((r) => r.id as string)
      await this.index.delete(ids)

      console.log(
        `[UpstashStorage] ✓ Deleted ${ids.length} documents for source: ${source}`
      )
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error(`[UpstashStorage] ✗ Delete failed:`, err.message)
      throw error
    }
  }

  /**
   * Get statistics about stored documents
   */
  async getStats(): Promise<StorageStats> {
    console.log(`[UpstashStorage] Getting stats...`)

    try {
      const info = await this.index.info()

      return {
        totalDocuments: info.vectorCount || 0,
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error(`[UpstashStorage] ✗ Failed to get stats:`, err.message)
      return {
        totalDocuments: 0,
      }
    }
  }

  /**
   * Create a deterministic hash from URL for consistent IDs
   */
  private hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return `doc-${Math.abs(hash).toString(36)}`
  }
}

/**
 * Create a singleton instance
 */
let storageInstance: UpstashDocStorage | null = null

export function getDocStorage(): UpstashDocStorage {
  if (!storageInstance) {
    storageInstance = new UpstashDocStorage()
  }
  return storageInstance
}
