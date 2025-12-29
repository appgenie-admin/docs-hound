import { NextRequest, NextResponse } from 'next/server'
import { Index } from '@upstash/vector'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface DocumentMetadata {
  id: string
  url: string
  title: string
  excerpt?: string
  source: string
  scrapedAt: string
}

/**
 * GET /api/pages/markdown?url=<encoded-url>
 *
 * Fetches the markdown content for a specific indexed page
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    const vectorUrl = process.env.UPSTASH_VECTOR_REST_URL
    const vectorToken = process.env.UPSTASH_VECTOR_REST_TOKEN

    if (!vectorUrl || !vectorToken) {
      return NextResponse.json(
        { error: 'Vector database not configured' },
        { status: 500 }
      )
    }

    const index = new Index({ url: vectorUrl, token: vectorToken })

    console.log(`[MarkdownAPI] Fetching document for URL: ${url}`)

    // Query by URL using metadata filter instead of fetching by ID
    // This is more reliable since the vector ID is a hash
    const results = await index.query({
      data: '', // Empty query to avoid semantic search
      topK: 1,
      includeData: true,
      includeMetadata: true,
      filter: `url = '${url}'`, // Exact match on URL
    })

    if (!results || results.length === 0) {
      console.log(`[MarkdownAPI] ✗ Document not found: ${url}`)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const document = results[0]
    const metadata = document.metadata as unknown as DocumentMetadata

    console.log(`[MarkdownAPI] ✓ Found document: ${metadata.title}`)

    return NextResponse.json({
      url: metadata.url,
      title: metadata.title,
      content: document.data as string,
      source: metadata.source,
      scrapedAt: metadata.scrapedAt,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[MarkdownAPI] ✗ Error fetching document:', err.message)
    return NextResponse.json(
      { error: 'Failed to fetch document', details: err.message },
      { status: 500 }
    )
  }
}
