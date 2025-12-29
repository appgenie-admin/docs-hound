# Soft 404 Detection

## Overview

The crawler now automatically detects and filters out both **hard 404s** (HTTP 404 status code) and **soft 404s** (pages that return HTTP 200 but display 404-like content).

## Problem

Some documentation sites return `200 OK` status codes even when a page doesn't exist, showing custom 404 error pages instead. This causes the crawler to include these non-existent pages in the discovered URLs list, leading to wasted indexing and polluted search results.

## Solution

The crawler now analyzes the HTML content of each page to detect soft 404 indicators before adding the URL to the discovered list.

## Detection Strategy

The `isSoft404()` method checks multiple indicators:

### 1. Page Title

Checks if the title contains:

- `404`
- `not found`
- `page not found`
- `does not exist`

### 2. Main Heading (H1)

Checks if the h1 element contains:

- `404`
- `not found`
- `page not found`
- `couldn't find`
- `does not exist`

### 3. Body Content - Strong Indicators

High-confidence phrases that indicate a 404:

- `error 404`
- `http 404`
- `404 error`
- `page you are looking for`
- `page you're looking for`
- `page you were looking for`
- `couldn't find this page`
- `can't find that page`
- `this page does not exist`
- `this page doesn't exist`

### 4. Short Content with Keywords

For pages with less than 500 characters of body text, checks if content includes both:

- `not found` AND
- `page` OR `url`

This catches minimal error pages.

## Implementation

```typescript
private isSoft404(html: string): boolean {
  // Parses HTML using JSDOM
  // Checks title, h1, and body content
  // Returns true if 404 indicators found
}
```

### Integration

The soft 404 check happens in `crawlPage()`:

```typescript
const html = await response.text()

// Check for soft 404s (pages that return 200 but show 404 content)
if (this.isSoft404(html)) {
  console.log(`[Crawler] Soft 404 detected for ${url}, skipping...`)
  return
}

// Store result based on mode (only if not a soft 404)
if (this.discoveryMode) {
  this.discoveryResults.push({ url: normalized, depth })
} else {
  this.results.push({ url: normalized, html, depth })
}
```

## Log Output

When a soft 404 is detected, you'll see:

```
[Crawler] Soft 404 detected for https://docs.example.com/missing-page, skipping...
```

## Examples

### PowerSync Soft 404 Example

**URL:** `https://docs.powersync.com/some-missing-page`

**Status Code:** `200 OK` (appears successful)

**HTML Content:**

```html
<html>
  <head>
    <title>Page Not Found - PowerSync</title>
  </head>
  <body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </body>
</html>
```

**Detection:** ✅ Caught by title check (`Page Not Found`) and h1 check (`404`)

**Result:** URL is **NOT** added to discovered URLs list

### Common Patterns Detected

1. **Docusaurus-style 404s**

   ```html
   <title>Page Not Found | Documentation</title>
   <h1>Page Not Found</h1>
   ```

2. **Next.js 404s**

   ```html
   <title>404: This page could not be found</title>
   <h1>404</h1>
   ```

3. **Custom Error Pages**

   ```html
   <h1>Oops! We couldn't find that page</h1>
   <p>The page you're looking for doesn't exist.</p>
   ```

4. **Minimal Error Pages**
   ```html
   <body>
     Page not found
   </body>
   ```

## Benefits

1. **Cleaner URL Lists**: Only valid pages appear in discovery results
2. **Faster Indexing**: Skip processing of non-existent pages
3. **Better Search Quality**: No 404 pages in search results
4. **Accurate Counts**: Discovered page counts reflect actual content

## Limitations

The detection is heuristic-based and may occasionally:

- **Miss** some soft 404s with unusual error messages
- **False positive** on pages legitimately discussing 404 errors

The detection patterns are conservative to minimize false positives.

## Configuration

Soft 404 detection is **always enabled** for both discovery and full crawl modes. There are no configuration options needed.

## Testing

To verify soft 404 detection is working:

1. Add a documentation site with known broken links
2. Start discovery
3. Check the terminal/logs for `Soft 404 detected` messages
4. Verify those URLs are NOT in the discovered URLs list

## Future Enhancements

Potential improvements:

- Configurable soft 404 patterns
- Machine learning-based detection
- Confidence scoring
- Manual override for specific URLs
- Statistics on detected soft 404s

## Related Files

- `packages/doc-scraper/src/lib/crawler.ts` - Implementation of `isSoft404()` and integration
- Detection happens during the `crawlPage()` method
- Works in both discovery and full crawl modes
