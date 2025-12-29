# URL Filtering Architecture

## Overview Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER ADDS SITE WITH FILTERS                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Site Metadata (Redis)                                            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ name: "Mantine v7"                                        │    │
│  │ baseUrl: "https://v7.mantine.dev/getting-started/"       │    │
│  │ urlFilters: {                                             │    │
│  │   includePatterns: ["^https://v7\\.mantine\\.dev/"]      │    │
│  │   excludePatterns: []                                     │    │
│  │ }                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DISCOVERY STARTS                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Crawler Initialization                                           │
│  1. Read site metadata                                            │
│  2. Parse URL filter patterns                                     │
│  3. Convert strings to RegExp objects                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FOR EACH DISCOVERED URL                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  URL Found     │
                    │  on Page       │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Domain Match?      │
                    │ (same hostname)    │
                    └────┬───────────┬───┘
                        NO           YES
                         │            │
                         ▼            ▼
                    ┌────────┐   ┌────────────────────┐
                    │ SKIP   │   │ Include Patterns?  │
                    └────────┘   │ (if any)           │
                                 └────┬───────────┬───┘
                                     NO           YES
                                      │            │
                                      ▼            ▼
                              ┌────────────┐  ┌──────────────┐
                              │ Matches    │  │ All URLs     │
                              │ at least   │  │ allowed      │
                              │ one?       │  └──────┬───────┘
                              └────┬───┬───┘         │
                                  NO  YES            │
                                   │   └──────────┬──┘
                                   ▼              │
                              ┌─────────┐         │
                              │  SKIP   │         │
                              └─────────┘         │
                                                  ▼
                                          ┌────────────────┐
                                          │ Exclude        │
                                          │ Patterns?      │
                                          └────┬───────┬───┘
                                              NO       YES
                                               │        │
                                               │        ▼
                                               │   ┌──────────┐
                                               │   │ Matches  │
                                               │   │ any?     │
                                               │   └────┬─┬───┘
                                               │       NO YES
                                               │        │  │
                                               │        │  ▼
                                               │        │ ┌────┐
                                               │        │ │SKIP│
                                               │        │ └────┘
                                               │        │
                                               └────────┘
                                                    │
                                                    ▼
                                            ┌────────────────┐
                                            │   CRAWL URL    │
                                            └────────────────┘
```

## Filter Logic Pseudocode

```javascript
function shouldCrawl(url, baseUrl, includePatterns, excludePatterns) {
  // Step 1: Check domain
  if (!sameHostname(url, baseUrl)) {
    return false // Must be same domain
  }

  // Step 2: Apply include patterns (if any)
  if (includePatterns.length > 0) {
    if (!includePatterns.some((pattern) => pattern.test(url))) {
      return false // Must match at least one include pattern
    }
  }

  // Step 3: Apply exclude patterns
  if (excludePatterns.some((pattern) => pattern.test(url))) {
    return false // Any exclude match means skip
  }

  // Passed all filters!
  return true
}
```

## Example: Mantine v7

### Configuration

```json
{
  "baseUrl": "https://v7.mantine.dev/getting-started/",
  "urlFilters": {
    "includePatterns": ["^https://v7\\.mantine\\.dev/"],
    "excludePatterns": []
  }
}
```

### URL Filtering Results

| URL                                       | Domain Match | Include Match | Exclude Match | Result       |
| ----------------------------------------- | ------------ | ------------- | ------------- | ------------ |
| `https://v7.mantine.dev/core/button/`     | ✅           | ✅            | ❌            | **CRAWL** ✅ |
| `https://v7.mantine.dev/hooks/use-state/` | ✅           | ✅            | ❌            | **CRAWL** ✅ |
| `https://mantine.dev/getting-started/`    | ✅           | ❌            | ❌            | **SKIP** ❌  |
| `https://v8.mantine.dev/core/button/`     | ✅           | ❌            | ❌            | **SKIP** ❌  |
| `https://twitter.com/mantinedev`          | ❌           | N/A           | N/A           | **SKIP** ❌  |

## Example: Next.js (exclude v15)

### Configuration

```json
{
  "baseUrl": "https://nextjs.org/docs/app/getting-started",
  "urlFilters": {
    "includePatterns": ["^https://nextjs\\.org/docs/app/"],
    "excludePatterns": ["/docs/15/"]
  }
}
```

### URL Filtering Results

| URL                                                     | Domain | Include | Exclude | Result       |
| ------------------------------------------------------- | ------ | ------- | ------- | ------------ |
| `https://nextjs.org/docs/app/building-your-application` | ✅     | ✅      | ❌      | **CRAWL** ✅ |
| `https://nextjs.org/docs/app/api-reference`             | ✅     | ✅      | ❌      | **CRAWL** ✅ |
| `https://nextjs.org/docs/15/app/getting-started`        | ✅     | ✅      | ✅      | **SKIP** ❌  |
| `https://nextjs.org/docs/pages/building`                | ✅     | ❌      | ❌      | **SKIP** ❌  |
| `https://nextjs.org/showcase`                           | ✅     | ❌      | ❌      | **SKIP** ❌  |

## Data Storage

### Redis Structure

```
site:v7.mantine.dev (hash)
  ├─ name: "Mantine v7"
  ├─ baseUrl: "https://v7.mantine.dev/getting-started/"
  ├─ status: "discovered"
  ├─ urlFilters: '{"includePatterns":["^https://v7\\.mantine\\.dev/"],"excludePatterns":[]}'
  └─ ... (other metadata)

site:v7.mantine.dev:discovered (set)
  ├─ "https://v7.mantine.dev/getting-started/"
  ├─ "https://v7.mantine.dev/core/button/"
  ├─ "https://v7.mantine.dev/core/text-input/"
  └─ ... (more discovered URLs)
```

## UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Add New Site Page                         │
│                                                              │
│  Documentation URL: [https://v7.mantine.dev/getting-started]│
│  Name: [Mantine v7]                                          │
│  Description: [Mantine UI library version 7]                 │
│                                                              │
│  ────────────── URL Filters (Optional) ──────────────       │
│                                                              │
│  ▼ How URL Filters Work (expandable help)                   │
│                                                              │
│  Include Patterns                         [+ Add Pattern]   │
│  [^https://v7\.mantine\.dev/            ] [🗑️]              │
│                                                              │
│  Exclude Patterns                         [+ Add Pattern]   │
│  (no patterns - no URLs filtered out)                        │
│                                                              │
│  [Cancel]                  [Add & Start Discovery]           │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Site Detail Page                          │
│                                                              │
│  Mantine v7                                    [URL Filters] │
│  https://v7.mantine.dev                                      │
│                                                              │
│  Status: discovered                                          │
│  Pages Found: 247                                            │
│                                                              │
│  [Start Indexing]                                            │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
UrlFiltersModal
  ├─ Modal (Mantine)
  │   └─ UrlFiltersForm
  │       ├─ Accordion (help section)
  │       ├─ Include Patterns Section
  │       │   ├─ TextInput (pattern 1)
  │       │   ├─ TextInput (pattern 2)
  │       │   └─ [+ Add Pattern] button
  │       └─ Exclude Patterns Section
  │           ├─ TextInput (pattern 1)
  │           └─ [+ Add Pattern] button
  └─ [Save Filters] button
      │
      ▼
  PATCH /api/sites/:domain
      │
      ▼
  Update Redis + Reload Page
```

## Pattern Matching Examples

### Simple Domain Match

```
Pattern: ^https://docs\.example\.com/
Matches:
  ✅ https://docs.example.com/intro
  ✅ https://docs.example.com/api/reference
  ❌ https://example.com/docs/intro
  ❌ https://docs.example.com:8080/intro
```

### Version-Specific Path

```
Pattern: /v7\./
Matches:
  ✅ https://example.com/v7.0/intro
  ✅ https://example.com/docs/v7.1/api
  ❌ https://example.com/v7/intro (no dot)
  ❌ https://example.com/v8.0/intro
```

### Multiple Versions Exclusion

```
Pattern: /(v5|v6|legacy)/
Matches (excludes):
  ✅ https://docs.example.com/v5/intro
  ✅ https://docs.example.com/v6.0/api
  ✅ https://docs.example.com/legacy/guide
  ❌ https://docs.example.com/v7/intro
```

## Regex Cheat Sheet

| Pattern  | Meaning              | Example                             |
| -------- | -------------------- | ----------------------------------- |
| `^`      | Start of string      | `^https://` matches beginning       |
| `$`      | End of string        | `/docs$` matches end                |
| `\.`     | Literal dot          | `\.com` matches ".com"              |
| `[0-9]+` | One or more digits   | `/v[0-9]+/` matches "/v7/"          |
| `(a\|b)` | Alternative (a or b) | `/(v5\|v6)/` matches v5 or v6       |
| `.*`     | Any characters       | `/docs/.*` matches "/docs/anything" |
| `\d`     | Any digit            | `/v\d\./` matches "/v7."            |
| `\w`     | Any word char        | `\w+` matches "hello"               |

## Testing Workflow

```
1. Create site with filters
   ↓
2. Start discovery
   ↓
3. Review discovered URLs
   ↓
4. URLs correct? ─── NO ──→ Update filters ──→ Re-discover
   │                              ↑                │
   YES                            └────────────────┘
   ↓
5. Start indexing
   ↓
6. Chat with docs!
```
