import { Redis } from '@upstash/redis'
import type { Site, SiteMetadata, SiteStatus } from './types'

/**
 * Redis key patterns:
 * - `sites` - Set containing all registered site domains
 * - `site:{domain}` - Hash with site metadata
 * - `site:{domain}:discovered` - Set containing discovered URLs for review
 * - `site:{domain}:pages` - Set containing indexed page URLs
 */

/**
 * Convert SiteMetadata to a flat record for Redis storage
 */
function metadataToRecord(
  metadata: SiteMetadata
): Record<string, string | number> {
  return {
    name: metadata.name,
    description: metadata.description,
    baseUrl: metadata.baseUrl,
    status: metadata.status,
    pageCount: metadata.pageCount,
    discoveredCount: metadata.discoveredCount,
    lastIndexedAt: metadata.lastIndexedAt || '',
    lastDiscoveredAt: metadata.lastDiscoveredAt || '',
    createdAt: metadata.createdAt,
    errorMessage: metadata.errorMessage || '',
  }
}

/**
 * Upstash Redis client for site registry management
 */
export class SiteRegistry {
  private redis: Redis

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error(
        'Missing required environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
      )
    }

    this.redis = new Redis({ url, token })
    console.log('[SiteRegistry] Initialized with Upstash Redis')
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url)
      return parsed.hostname
    } catch {
      return url
    }
  }

  /**
   * Get the Redis key for a site
   */
  private siteKey(domain: string): string {
    return `site:${domain}`
  }

  /**
   * Get all registered sites
   */
  async listSites(): Promise<Site[]> {
    const domains = await this.redis.smembers('sites')

    if (domains.length === 0) {
      return []
    }

    const sites: Site[] = []
    for (const domain of domains) {
      const metadata = await this.getSite(domain)
      if (metadata) {
        sites.push({ domain, ...metadata })
      }
    }

    return sites.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * Get a site by domain
   */
  async getSite(domain: string): Promise<SiteMetadata | null> {
    const data = await this.redis.hgetall(this.siteKey(domain))

    if (!data || Object.keys(data).length === 0) {
      return null
    }

    return {
      name: (data.name as string) || domain,
      description: (data.description as string) || '',
      baseUrl: (data.baseUrl as string) || '',
      status: (data.status as SiteStatus) || 'pending',
      pageCount: parseInt(String(data.pageCount || '0'), 10),
      discoveredCount: parseInt(String(data.discoveredCount || '0'), 10),
      lastIndexedAt: (data.lastIndexedAt as string) || null,
      lastDiscoveredAt: (data.lastDiscoveredAt as string) || null,
      createdAt: (data.createdAt as string) || new Date().toISOString(),
      errorMessage: (data.errorMessage as string) || undefined,
    }
  }

  /**
   * Add a new site
   */
  async addSite(
    url: string,
    name?: string,
    description?: string
  ): Promise<Site> {
    const domain = this.extractDomain(url)
    const now = new Date().toISOString()

    const metadata: SiteMetadata = {
      name: name || domain,
      description: description || '',
      baseUrl: url,
      status: 'pending',
      pageCount: 0,
      discoveredCount: 0,
      lastIndexedAt: null,
      lastDiscoveredAt: null,
      createdAt: now,
    }

    // Add to sites set
    await this.redis.sadd('sites', domain)

    // Store metadata
    await this.redis.hset(this.siteKey(domain), metadataToRecord(metadata))

    console.log(`[SiteRegistry] Added site: ${domain}`)
    return { domain, ...metadata }
  }

  /**
   * Update a site's status
   */
  async updateStatus(
    domain: string,
    status: SiteStatus,
    errorMessage?: string
  ): Promise<void> {
    const updates: Record<string, string> = { status }

    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage
    }

    if (status === 'discovered') {
      updates.lastDiscoveredAt = new Date().toISOString()
    }

    if (status === 'indexed') {
      updates.lastIndexedAt = new Date().toISOString()
    }

    await this.redis.hset(this.siteKey(domain), updates)
    console.log(`[SiteRegistry] Updated ${domain} status to: ${status}`)
  }

  /**
   * Update a site's metadata
   */
  async updateSite(
    domain: string,
    updates: Partial<SiteMetadata>
  ): Promise<void> {
    const record: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        record[key] = value === null ? '' : value
      }
    }
    await this.redis.hset(this.siteKey(domain), record)
    console.log(`[SiteRegistry] Updated ${domain} metadata`)
  }

  /**
   * Remove a site and all its data
   */
  async removeSite(domain: string): Promise<void> {
    // Remove from sites set
    await this.redis.srem('sites', domain)

    // Delete all site keys
    await this.redis.del(
      this.siteKey(domain),
      `${this.siteKey(domain)}:discovered`,
      `${this.siteKey(domain)}:pages`
    )

    console.log(`[SiteRegistry] Removed site: ${domain}`)
  }

  /**
   * Store discovered URLs for review
   */
  async setDiscoveredUrls(domain: string, urls: string[]): Promise<void> {
    const key = `${this.siteKey(domain)}:discovered`

    // Clear existing discovered URLs
    await this.redis.del(key)

    if (urls.length > 0) {
      await this.redis.sadd(key, urls)
    }

    // Update discovered count
    await this.redis.hset(this.siteKey(domain), {
      discoveredCount: urls.length.toString(),
    })

    console.log(
      `[SiteRegistry] Stored ${urls.length} discovered URLs for ${domain}`
    )
  }

  /**
   * Get discovered URLs for review
   */
  async getDiscoveredUrls(domain: string): Promise<string[]> {
    const key = `${this.siteKey(domain)}:discovered`
    return await this.redis.smembers(key)
  }

  /**
   * Store indexed page URLs
   */
  async setIndexedPages(domain: string, urls: string[]): Promise<void> {
    const key = `${this.siteKey(domain)}:pages`

    // Clear existing pages
    await this.redis.del(key)

    if (urls.length > 0) {
      await this.redis.sadd(key, urls)
    }

    // Update page count
    await this.redis.hset(this.siteKey(domain), {
      pageCount: urls.length.toString(),
    })

    console.log(
      `[SiteRegistry] Stored ${urls.length} indexed pages for ${domain}`
    )
  }

  /**
   * Get indexed page URLs
   */
  async getIndexedPages(domain: string): Promise<string[]> {
    const key = `${this.siteKey(domain)}:pages`
    return await this.redis.smembers(key)
  }

  /**
   * Check if a site exists
   */
  async siteExists(domain: string): Promise<boolean> {
    const result = await this.redis.sismember('sites', domain)
    return result === 1
  }
}

/**
 * Create a singleton instance
 */
let siteRegistryInstance: SiteRegistry | null = null

export function getSiteRegistry(): SiteRegistry {
  if (!siteRegistryInstance) {
    siteRegistryInstance = new SiteRegistry()
  }
  return siteRegistryInstance
}
