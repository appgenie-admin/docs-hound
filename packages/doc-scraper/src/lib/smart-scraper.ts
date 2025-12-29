import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'

export interface ScrapedPage {
  title: string
  content: string
  excerpt?: string
}

/**
 * Smart scraper using Mozilla Readability for intelligent content extraction
 * This is the same engine used by Firefox's Reader View
 *
 * Benefits:
 * - Automatically removes navigation, headers, footers, ads
 * - Works across different documentation frameworks
 * - Robust to site structure changes
 * - No custom CSS selectors needed
 */
export async function scrapePageToMarkdown(
  url: string,
  html: string
): Promise<ScrapedPage> {
  try {
    console.log(`[SmartScraper] Processing ${url}`)

    // 1. Create DOM from HTML
    const dom = new JSDOM(html, { url })

    // 2. Use Readability to extract main article content
    const reader = new Readability(dom.window.document, {
      // Optional: increase debug output
      debug: false,
    })

    const article = reader.parse()

    if (!article || !article.content) {
      throw new Error('No article content found by Readability')
    }

    console.log(`[SmartScraper] ✓ Extracted article: "${article.title}"`)

    // 3. Convert clean HTML to Markdown
    const turndown = new TurndownService({
      codeBlockStyle: 'fenced',
      headingStyle: 'atx',
      bulletListMarker: '-',
      emDelimiter: '_',
    })

    // Preserve code blocks
    turndown.addRule('codeBlock', {
      filter: ['pre'],
      replacement: (content, node) => {
        const element = node as HTMLElement
        const codeElement = element.querySelector('code')
        const language = codeElement?.className.match(/language-(\w+)/)?.[1]
        const code = codeElement?.textContent || content
        return `\n\`\`\`${language || ''}\n${code}\n\`\`\`\n`
      },
    })

    const markdown = turndown.turndown(article.content)

    console.log(
      `[SmartScraper] ✓ Converted to markdown (${markdown.length} chars)`
    )

    return {
      title: article.title || 'Untitled',
      content: markdown,
      excerpt: article.excerpt || undefined,
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error(`[SmartScraper] ✗ Error processing ${url}:`, err.message)
    throw new Error(`Failed to scrape page: ${err.message}`)
  }
}

/**
 * Fetch HTML from a URL
 */
export async function fetchHtml(url: string): Promise<string> {
  console.log(`[SmartScraper] Fetching ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; DocsHound/1.0; +https://github.com/docs-hound)',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()
  console.log(`[SmartScraper] ✓ Fetched ${html.length} bytes`)

  return html
}
