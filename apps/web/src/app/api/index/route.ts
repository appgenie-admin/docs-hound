import { NextRequest, NextResponse } from 'next/server'
import { getSiteRegistry } from '@docs-hound/shared-db'
import {
  Crawler,
  scrapePageToMarkdown,
  getDocStorage,
  type DocumentMetadata,
} from '@docs-hound/doc-scraper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, urls } = body

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs are required' }, { status: 400 })
    }

    const registry = getSiteRegistry()

    // Get site metadata
    const site = await registry.getSite(domain)
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Update status to indexing
    await registry.updateStatus(domain, 'indexing')

    // Start indexing in background (fire-and-forget pattern)
    indexPages(domain, urls).catch((error) => {
      console.error(`[Index] Error for ${domain}:`, error)
      registry.updateStatus(domain, 'error', String(error))
    })

    return NextResponse.json({ success: true, status: 'indexing' })
  } catch (error) {
    console.error('Failed to start indexing:', error)
    return NextResponse.json(
      { error: 'Failed to start indexing' },
      { status: 500 }
    )
  }
}

async function indexPages(domain: string, urls: string[]): Promise<void> {
  console.log(`[Index] Starting indexing for ${domain} (${urls.length} pages)`)

  const registry = getSiteRegistry()
  const storage = getDocStorage()

  try {
    // Delete existing documents for this domain
    await storage.deleteBySource(domain)

    // Crawl the selected pages
    const crawler = new Crawler({
      maxDepth: 0, // Only fetch the specified URLs
      maxPages: urls.length,
      concurrency: 3,
      delayMs: 500,
      allowedDomains: [domain],
    })

    const crawlResults = await crawler.crawl(urls)

    console.log(`[Index] Crawled ${crawlResults.length} pages for ${domain}`)

    // Process pages and extract content
    const documents: DocumentMetadata[] = []
    const indexedUrls: string[] = []

    for (const result of crawlResults) {
      try {
        const scraped = await scrapePageToMarkdown(result.url, result.html)

        if (scraped.content && scraped.content.length > 50) {
          documents.push({
            id: `${domain}-${documents.length}`,
            url: result.url,
            title: scraped.title,
            content: scraped.content,
            excerpt: scraped.excerpt,
            source: domain,
            scrapedAt: new Date().toISOString(),
          })
          indexedUrls.push(result.url)
        } else {
          console.log(`[Index] Skipping ${result.url} - no content`)
        }
      } catch (error) {
        console.error(`[Index] Failed to process ${result.url}:`, error)
      }
    }

    console.log(`[Index] Processed ${documents.length} documents for ${domain}`)

    // Upsert to vector storage
    if (documents.length > 0) {
      await storage.upsertDocuments(documents, domain)
    }

    // Store indexed page URLs
    await registry.setIndexedPages(domain, indexedUrls)

    // Update site metadata
    await registry.updateSite(domain, {
      pageCount: indexedUrls.length,
      lastIndexedAt: new Date().toISOString(),
    })
    await registry.updateStatus(domain, 'indexed')

    console.log(
      `[Index] Completed for ${domain}: ${indexedUrls.length} pages indexed`
    )
  } catch (error) {
    console.error(`[Index] Failed for ${domain}:`, error)
    await registry.updateStatus(domain, 'error', String(error))
    throw error
  }
}
