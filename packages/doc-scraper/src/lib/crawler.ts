import PQueue from 'p-queue'
import { JSDOM } from 'jsdom'

export interface CrawlerOptions {
  maxDepth?: number
  maxPages?: number
  concurrency?: number
  delayMs?: number
  allowedDomains?: string[]
  excludePatterns?: RegExp[]
  /** Discovery mode - only collect URLs, don't fetch HTML content */
  discoveryMode?: boolean
}

export interface CrawlResult {
  url: string
  html: string
  depth: number
}

export interface DiscoveryResult {
  url: string
  depth: number
}

/** Maximum pages for discovery mode (bail out threshold) */
const DISCOVERY_LIMIT = 1000

/**
 * Generic web crawler with URL filtering, rate limiting, and queue management
 * Supports both full crawling and discovery-only mode
 */
export class Crawler {
  private visited = new Set<string>()
  private queued = new Set<string>() // URLs queued for crawling (to prevent duplicate queue entries)
  private discovered = new Set<string>() // URLs found but not crawled (due to maxPages)
  private queue: PQueue
  private results: CrawlResult[] = []
  private discoveryResults: DiscoveryResult[] = []
  private maxDepth: number
  private maxPages: number
  private delayMs: number
  private allowedDomains: string[]
  private excludePatterns: RegExp[]
  private discoveryMode: boolean
  private hitLimit = false

  constructor(options: CrawlerOptions = {}) {
    this.maxDepth = options.maxDepth ?? 3
    this.maxPages = options.maxPages ?? DISCOVERY_LIMIT
    this.delayMs = options.delayMs ?? 500
    this.allowedDomains = options.allowedDomains ?? []
    this.excludePatterns = options.excludePatterns ?? []
    this.discoveryMode = options.discoveryMode ?? false

    // In discovery mode, enforce the 1000 page limit
    if (this.discoveryMode && this.maxPages > DISCOVERY_LIMIT) {
      console.log(
        `[Crawler] Discovery mode: limiting maxPages from ${this.maxPages} to ${DISCOVERY_LIMIT}`
      )
      this.maxPages = DISCOVERY_LIMIT
    }

    // Configure queue with concurrency limit
    this.queue = new PQueue({
      concurrency: options.concurrency ?? 5,
      interval: this.delayMs,
      intervalCap: 1,
    })
  }

  /**
   * Normalize URL for deduplication
   * Removes hash fragments and query parameters to avoid duplicate content
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      // Remove hash and search params
      parsed.hash = ''
      parsed.search = ''
      // Remove trailing slash for consistency
      parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/'
      return parsed.toString()
    } catch {
      return url
    }
  }

  /**
   * Check if URL matches the allowed domain/path pattern
   */
  private matchesBaseDomain(url: string, baseUrl: string): boolean {
    try {
      const urlParsed = new URL(url)
      const baseParsed = new URL(baseUrl)

      // Must match hostname exactly
      return urlParsed.hostname === baseParsed.hostname
    } catch {
      return false
    }
  }

  /**
   * Check if URL should be crawled
   */
  private shouldCrawl(url: string, baseUrl?: string): boolean {
    try {
      const parsed = new URL(url)
      const normalized = this.normalizeUrl(url)

      // Only allow http/https protocols (no mailto:, tel:, javascript:, etc.)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false
      }

      // Already visited or queued (check normalized version)
      if (this.visited.has(normalized) || this.queued.has(normalized)) {
        return false
      }

      // Check domain whitelist - EXACT hostname match only
      if (this.allowedDomains.length > 0) {
        const matchesDomain = this.allowedDomains.some(
          (domain) => parsed.hostname === domain
        )
        if (!matchesDomain) {
          return false
        }
      }

      // If we have a base URL, ensure this URL is under the same domain
      if (baseUrl && !this.matchesBaseDomain(url, baseUrl)) {
        return false
      }

      // Check exclude patterns (check before adding to queue)
      if (this.excludePatterns.some((pattern) => pattern.test(url))) {
        return false
      }

      // Check max pages limit
      if (this.visited.size >= this.maxPages) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Extract links from HTML
   * Filters out hash-only links and normalizes URLs
   */
  private extractLinks(html: string, baseUrl: string): string[] {
    try {
      const dom = new JSDOM(html, { url: baseUrl })
      const links: string[] = []
      const seenNormalized = new Set<string>()

      const anchors = dom.window.document.querySelectorAll('a[href]')
      anchors.forEach((anchor: Element) => {
        const href = anchor.getAttribute('href')
        if (href) {
          try {
            const absoluteUrl = new URL(href, baseUrl).toString()
            const normalized = this.normalizeUrl(absoluteUrl)

            // Skip if we've already seen this normalized URL in this extraction
            if (!seenNormalized.has(normalized)) {
              seenNormalized.add(normalized)
              links.push(absoluteUrl)
            }
          } catch {
            // Invalid URL, skip
          }
        }
      })

      return links
    } catch (error) {
      console.warn(`[Crawler] Failed to extract links from ${baseUrl}:`, error)
      return []
    }
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(
    url: string,
    depth: number,
    baseUrl: string
  ): Promise<void> {
    const normalized = this.normalizeUrl(url)

    console.log(
      `[Crawler] Task started for ${url} (visited: ${this.visited.size}/${this.maxPages}, queued: ${this.queued.size})`
    )

    // Remove from queued set since we're now processing it
    this.queued.delete(normalized)

    // Check if already visited (race condition - multiple tasks may have been queued before any processed)
    if (this.visited.has(normalized)) {
      console.log(`[Crawler] Skipping ${url} (already visited)`)
      return
    }

    // Check max pages before marking visited (race condition protection)
    if (this.visited.size >= this.maxPages) {
      console.log(`[Crawler] Skipping ${url} (max pages already reached)`)
      this.hitLimit = true
      return
    }

    // Mark as visited (using normalized URL)
    this.visited.add(normalized)

    try {
      console.log(
        `[Crawler] Crawling (depth ${depth}): ${url} [${this.visited.size}/${this.maxPages}]`
      )

      // Fetch the page
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; DocsHound/1.0; +https://github.com/docs-hound)',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout
      })

      if (!response.ok) {
        console.warn(
          `[Crawler] HTTP ${response.status} for ${url}, skipping...`
        )
        return
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        console.log(`[Crawler] Skipping non-HTML content: ${url}`)
        return
      }

      const html = await response.text()

      // Store result based on mode
      if (this.discoveryMode) {
        this.discoveryResults.push({ url: normalized, depth })
      } else {
        this.results.push({ url: normalized, html, depth })
      }

      console.log(
        `[Crawler] Page stored. Queue stats: size=${this.queue.size}, pending=${this.queue.pending}`
      )

      // Extract and queue child links if not at max depth
      if (depth < this.maxDepth) {
        // DON'T extract links if we've reached max pages
        if (this.visited.size >= this.maxPages) {
          console.log(
            `[Crawler] Reached ${this.maxPages} pages, skipping link extraction`
          )
          this.hitLimit = true
          return
        }

        const links = this.extractLinks(html, url)
        const uniqueLinks = [...new Set(links)]

        console.log(
          `[Crawler] Found ${uniqueLinks.length} links on ${url}, filtering...`
        )

        let addedCount = 0
        let skippedDuplicates = 0

        for (const link of uniqueLinks) {
          const normalizedLink = this.normalizeUrl(link)

          // Stop adding if we've already queued enough tasks to reach max pages
          // Don't count pending (that's the current task) - only visited + queued
          const potentialTotal = this.visited.size + this.queue.size
          if (potentialTotal >= this.maxPages) {
            // Add remaining valid links to discovered set (for next batch)
            if (this.shouldCrawl(link, baseUrl)) {
              this.discovered.add(normalizedLink)
            }
            this.hitLimit = true
            continue
          }

          // Check if this link should be crawled (includes deduplication)
          if (this.shouldCrawl(link, baseUrl)) {
            // Mark as queued to prevent duplicate queue entries
            this.queued.add(normalizedLink)
            // Add to queue
            this.queue.add(() => this.crawlPage(link, depth + 1, baseUrl))
            addedCount++
          } else if (this.visited.has(normalizedLink)) {
            skippedDuplicates++
          }
        }

        if (addedCount > 0) {
          console.log(
            `[Crawler] Added ${addedCount} new tasks (${skippedDuplicates} duplicates skipped, ${this.discovered.size} discovered for later). Queue stats: size=${this.queue.size}, pending=${this.queue.pending}`
          )
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error(`[Crawler] ✗ Error crawling ${url}:`, err.message)
    }

    console.log(
      `[Crawler] Task complete for ${url}. Queue stats: size=${this.queue.size}, pending=${this.queue.pending}`
    )
  }

  /**
   * Start crawling from seed URLs
   */
  async crawl(seedUrls: string[]): Promise<CrawlResult[]> {
    console.log(`[Crawler] Starting crawl with ${seedUrls.length} seed URLs`)
    console.log(
      `[Crawler] Config: maxDepth=${this.maxDepth}, maxPages=${this.maxPages}, concurrency=${this.queue.concurrency}, discoveryMode=${this.discoveryMode}`
    )

    this.results = []
    this.discoveryResults = []
    this.visited.clear()
    this.queued.clear()
    this.discovered.clear()
    this.hitLimit = false

    // Queue seed URLs (use first seed as base URL for domain filtering)
    const baseUrl = seedUrls[0]
    for (const url of seedUrls) {
      console.log(`[Crawler] Adding seed URL to queue: ${url}`)
      this.queue.add(() => this.crawlPage(url, 0, baseUrl))
    }

    console.log(
      `[Crawler] Waiting for queue to idle... (size=${this.queue.size}, pending=${this.queue.pending})`
    )

    // Wait for all tasks to complete
    await this.queue.onIdle()

    console.log(`[Crawler] ✓ Queue is idle!`)
    console.log(`[Crawler] ✓ Crawl complete: ${this.results.length} pages`)

    return this.results
  }

  /**
   * Discover URLs without fetching full content
   * Used for preview crawl before indexing
   */
  async discover(seedUrls: string[]): Promise<DiscoveryResult[]> {
    this.discoveryMode = true

    // Enforce discovery limit
    if (this.maxPages > DISCOVERY_LIMIT) {
      this.maxPages = DISCOVERY_LIMIT
    }

    await this.crawl(seedUrls)
    return this.discoveryResults
  }

  /**
   * Get crawl statistics
   */
  getStats() {
    return {
      pagesVisited: this.visited.size,
      pagesCrawled: this.discoveryMode
        ? this.discoveryResults.length
        : this.results.length,
      queueSize: this.queue.size,
      pending: this.queue.pending,
      hitLimit: this.hitLimit,
      maxPages: this.maxPages,
    }
  }

  /**
   * Check if the crawler hit the page limit
   */
  didHitLimit(): boolean {
    return this.hitLimit
  }

  /**
   * Get URLs that were discovered but not crawled (due to maxPages limit)
   * These can be used as seed URLs for the next batch
   */
  getDiscoveredUrls(): string[] {
    return Array.from(this.discovered)
  }
}
