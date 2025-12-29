// Crawler exports
export { Crawler } from './lib/crawler'
export type {
  CrawlerOptions,
  CrawlResult,
  DiscoveryResult,
} from './lib/crawler'

// Smart scraper exports
export { scrapePageToMarkdown, fetchHtml } from './lib/smart-scraper'
export type { ScrapedPage } from './lib/smart-scraper'

// Storage exports
export { UpstashDocStorage, getDocStorage } from './storage/upstash'
export type {
  DocumentMetadata,
  StorageStats,
  SearchResult,
} from './storage/upstash'
