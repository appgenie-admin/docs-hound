# URL Filters Guide

URL filters allow you to control exactly which pages are crawled and indexed from documentation sites. This is essential when dealing with:

- Multiple versions of documentation (e.g., v7 vs v8)
- Different frameworks/platforms of the same tool
- Unwanted sections that aren't relevant

## How URL Filters Work

URL filters use **regular expressions** (regex) to match against URLs during the crawl process. There are two types:

### 1. Include Patterns (Optional)

If you specify include patterns, **ONLY** URLs matching at least one of these patterns will be crawled.

- If empty: All URLs are included by default
- If specified: URLs must match at least one pattern to be crawled

### 2. Exclude Patterns (Optional)

URLs matching any exclude pattern will be skipped. These are applied **after** include patterns.

- Applied after include filters
- Any match will cause the URL to be excluded

## Pattern Matching Flow

```
1. Check if URL matches domain (always required)
2. IF include patterns exist:
   - URL must match at least one include pattern
   - If no match, URL is skipped
3. Check exclude patterns:
   - If URL matches any exclude pattern, it's skipped
4. If URL passes all filters, it's crawled
```

## Real-World Examples

Based on your requirements, here are specific patterns for each documentation site:

### Mantine v7 (Want to Scan)

**Base URL:** `https://v7.mantine.dev/getting-started/`

**Include Pattern:**

```
^https://v7\.mantine\.dev/
```

**Exclude Pattern (optional):**

```
^https://mantine\.dev/
```

### PowerSync Docs

**Base URL:** `https://docs.powersync.com/intro/powersync-overview`

**Include Pattern:**

```
^https://docs\.powersync\.com/
```

No exclude patterns needed (single version).

### Kysely Docs

**Base URL:** `https://kysely.dev/docs/getting-started`

**Include Pattern:**

```
^https://kysely\.dev/docs/
```

### React Router 6.30.2

**Base URL:** `https://reactrouter.com/6.30.2`

**Include Pattern:**

```
^https://reactrouter\.com/6\.30\.2/
```

**Exclude Pattern:**

```
^https://reactrouter\.com/home
```

### Zod v3

**Base URL:** `https://v3.zod.dev/`

**Include Pattern:**

```
^https://v3\.zod\.dev/
```

### Zustand Docs

**Base URL:** `https://zustand.docs.pmnd.rs/getting-started/introduction`

**Include Pattern:**

```
^https://zustand\.docs\.pmnd\.rs/
```

### React Hook Form

**Base URL:** `https://react-hook-form.com/docs`

**Include Pattern:**

```
^https://react-hook-form\.com/docs/
```

### AI SDK (latest, not v5)

**Base URL:** `https://ai-sdk.dev/docs/introduction`

**Include Pattern:**

```
^https://ai-sdk\.dev/docs/
```

**Exclude Pattern:**

```
^https://v5\.ai-sdk\.dev/
```

### Next.js App Router (not version 15)

**Base URL:** `https://nextjs.org/docs/app/getting-started`

**Include Pattern:**

```
^https://nextjs\.org/docs/app/
```

**Exclude Pattern:**

```
/docs/15/
```

## Regex Pattern Tips

### Escaping Special Characters

In regex, certain characters have special meanings and must be escaped with a backslash:

- `.` → `\.` (literal dot)
- `/` → `\/` (optional in JS, but clearer)
- `?` → `\?`
- `[` `]` → `\[` `\]`

### Common Patterns

**Match start of URL:**

```
^https://example\.com/
```

**Match version in path:**

```
/v[0-9]+\./    # Matches /v1./, /v2./, etc.
/docs/[0-9]+/  # Matches /docs/1/, /docs/2/, etc.
```

**Match specific version:**

```
/v7\./         # Matches /v7.0/, /v7.1/, etc.
/6\.30\.2/     # Matches exact version
```

**Exclude multiple versions:**

```
/(v5|v6|v7)/   # Matches any of these versions
```

## Using URL Filters in the UI

### When Adding a New Site

1. Navigate to "Add Documentation Site"
2. Fill in the basic information (URL, name, description)
3. Expand the "URL Filters (Optional)" section
4. Click "Add Pattern" under Include or Exclude sections
5. Enter your regex patterns
6. Click "Add & Start Discovery"

### Updating Filters on Existing Sites

1. Go to the site detail page
2. Click the "URL Filters" button (available in pending, discovered, and indexed states)
3. Modify the patterns
4. Click "Save Filters"
5. Click "Re-discover" to apply the new filters

## Testing Your Patterns

You can test regex patterns before using them:

1. Use a tool like [regex101.com](https://regex101.com/)
2. Select "JavaScript" flavor
3. Enter your pattern
4. Test with example URLs

**Example Test:**

Pattern: `^https://v7\.mantine\.dev/`

Test URLs:

- ✅ `https://v7.mantine.dev/getting-started/` → Match
- ✅ `https://v7.mantine.dev/core/button/` → Match
- ❌ `https://mantine.dev/getting-started/` → No match
- ❌ `https://v8.mantine.dev/core/button/` → No match

## Troubleshooting

### No URLs Discovered

If discovery returns 0 URLs:

1. **Check include patterns**: Make sure they're not too restrictive
2. **Test base URL**: Ensure your base URL matches your include pattern
3. **Check regex syntax**: Invalid regex will cause errors
4. **Remove filters temporarily**: Test without filters to see if URLs are found

### Wrong URLs Being Crawled

If unwanted URLs are being crawled:

1. **Add exclude patterns**: Filter out unwanted paths
2. **Make includes more specific**: Narrow down the include pattern
3. **Check pattern order**: Include patterns are applied before exclude patterns

### Regex Syntax Errors

The API will validate regex patterns when saving. Common errors:

- Unescaped special characters (use `\.` not `.`)
- Unclosed brackets `[` or `(`
- Invalid escape sequences

## API Usage

### Create Site with Filters

```bash
curl -X POST http://localhost:3000/api/sites \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://v7.mantine.dev/getting-started/",
    "name": "Mantine v7",
    "description": "Mantine UI library version 7 docs",
    "urlFilters": {
      "includePatterns": ["^https://v7\\.mantine\\.dev/"],
      "excludePatterns": []
    }
  }'
```

### Update Filters

```bash
curl -X PATCH http://localhost:3000/api/sites/v7.mantine.dev \
  -H "Content-Type: application/json" \
  -d '{
    "urlFilters": {
      "includePatterns": ["^https://v7\\.mantine\\.dev/"],
      "excludePatterns": ["^https://v7\\.mantine\\.dev/changelog/"]
    }
  }'
```

## Advanced Examples

### Complex Version Filtering

For sites with multiple versions in different formats:

**Include only React docs, not Angular/Vue:**

```
^https://framework\.dev/react/
```

**Exclude all preview/beta versions:**

```
/(preview|beta|alpha|rc)/
```

**Match specific semantic version:**

```
/v2\.(3|4|5)\./
```

### Path-Based Filtering

**Only API reference, not guides:**

```
Include: /api-reference/
Exclude: /(guide|tutorial|examples)/
```

**Exclude changelog and release notes:**

```
Exclude: /(changelog|releases?|what-?s-?new)/
```

## Best Practices

1. **Start Simple**: Begin with just include patterns, add excludes if needed
2. **Test First**: Use regex101.com to validate patterns
3. **Be Specific**: Anchor patterns with `^` when possible
4. **Document Your Patterns**: Note why you added specific filters
5. **Re-discover After Changes**: Always re-run discovery to apply new filters
6. **Check Results**: Review discovered URLs to ensure filters work as expected

## Filter Storage

URL filters are stored in the site metadata in Redis:

- Stored as JSON strings in `site:{domain}` hash
- Applied during both discovery and indexing phases
- Persisted across re-discoveries
- Can be updated at any time without re-indexing
