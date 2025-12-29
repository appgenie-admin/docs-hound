/**
 * Site status states for the two-stage indexing workflow
 */
export type SiteStatus =
  | 'pending' // Site added, awaiting discovery
  | 'discovering' // Preview crawl in progress (URL discovery only)
  | 'discovered' // URLs found, awaiting user review and approval
  | 'indexing' // User approved, content being indexed
  | 'indexed' // Successfully indexed and searchable
  | 'error' // Discovery or indexing failed

/**
 * URL filter configuration for controlling which pages to crawl
 */
export interface UrlFilters {
  /** Include only URLs matching these patterns (regex strings). If empty, all URLs are included. */
  includePatterns: string[]
  /** Exclude URLs matching these patterns (regex strings). Applied after include patterns. */
  excludePatterns: string[]
}

/**
 * Site metadata stored in Redis
 */
export interface SiteMetadata {
  /** Display name of the documentation site */
  name: string
  /** Brief description for glossary/search context */
  description: string
  /** Root URL of the documentation */
  baseUrl: string
  /** Current status in the workflow */
  status: SiteStatus
  /** Number of pages indexed */
  pageCount: number
  /** Number of pages discovered in preview crawl */
  discoveredCount: number
  /** ISO timestamp of last successful index */
  lastIndexedAt: string | null
  /** ISO timestamp of last preview crawl */
  lastDiscoveredAt: string | null
  /** ISO timestamp when site was added */
  createdAt: string
  /** Error message if status is 'error' */
  errorMessage?: string
  /** URL filter patterns for controlling which pages to crawl */
  urlFilters?: UrlFilters
}

/**
 * Site with its domain key
 */
export interface Site extends SiteMetadata {
  domain: string
}

/**
 * Discovered URL entry
 */
export interface DiscoveredUrl {
  url: string
  title?: string
  discoveredAt: string
}
