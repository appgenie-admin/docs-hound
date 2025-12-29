import { NextRequest, NextResponse } from 'next/server'
import { getSiteRegistry } from '@docs-hound/shared-db'
import { Crawler } from '@docs-hound/doc-scraper'

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and form data
    let domain: string | null = null

    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      domain = body.domain
    } else {
      const formData = await request.formData()
      domain = formData.get('domain') as string
    }

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    const registry = getSiteRegistry()

    // Get site metadata
    const site = await registry.getSite(domain)
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Update status to discovering
    await registry.updateStatus(domain, 'discovering')

    // Start discovery in background (fire-and-forget pattern)
    discoverUrls(domain, site.baseUrl).catch((error) => {
      console.error(`[Discover] Error for ${domain}:`, error)
      registry.updateStatus(domain, 'error', String(error))
    })

    // For form submissions, redirect back to site page
    if (!contentType?.includes('application/json')) {
      return NextResponse.redirect(
        new URL(`/sites/${encodeURIComponent(domain)}`, request.url)
      )
    }

    return NextResponse.json({ success: true, status: 'discovering' })
  } catch (error) {
    console.error('Failed to start discovery:', error)
    return NextResponse.json(
      { error: 'Failed to start discovery' },
      { status: 500 }
    )
  }
}

async function discoverUrls(domain: string, baseUrl: string): Promise<void> {
  console.log(`[Discover] Starting discovery for ${domain}`)

  const registry = getSiteRegistry()

  try {
    // Get site metadata to fetch URL filters
    const site = await registry.getSite(domain)
    if (!site) {
      throw new Error('Site not found')
    }

    // Build crawler options with URL filters
    const includePatterns = site.urlFilters?.includePatterns
      ? site.urlFilters.includePatterns.map((p) => new RegExp(p))
      : []
    const excludePatterns = site.urlFilters?.excludePatterns
      ? site.urlFilters.excludePatterns.map((p) => new RegExp(p))
      : []

    const crawler = new Crawler({
      maxDepth: 5,
      maxPages: 1000, // Discovery limit
      concurrency: 5,
      delayMs: 300,
      allowedDomains: [domain],
      discoveryMode: true,
      includePatterns,
      excludePatterns,
    })

    // Discover URLs
    const results = await crawler.discover([baseUrl])
    const urls = results.map((r) => r.url)

    console.log(`[Discover] Found ${urls.length} URLs for ${domain}`)

    // Store discovered URLs
    await registry.setDiscoveredUrls(domain, urls)

    // Update status
    const stats = crawler.getStats()
    await registry.updateSite(domain, {
      discoveredCount: urls.length,
      lastDiscoveredAt: new Date().toISOString(),
    })
    await registry.updateStatus(domain, 'discovered')

    if (stats.hitLimit) {
      console.log(`[Discover] Hit 1000 page limit for ${domain}`)
    }

    console.log(`[Discover] Completed for ${domain}: ${urls.length} URLs`)
  } catch (error) {
    console.error(`[Discover] Failed for ${domain}:`, error)
    await registry.updateStatus(domain, 'error', String(error))
    throw error
  }
}
