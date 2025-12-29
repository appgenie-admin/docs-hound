# Docs Hound - AI Agent Reference

## Project Overview

Documentation search platform that crawls, indexes, and semantically searches documentation sites. Includes MCP server for AI agent integration.

**Tech Stack:** Next.js 16, React 19, TypeScript, Turborepo, pnpm workspaces, Upstash (Redis + Vector), OpenAI

## Architecture

### Monorepo Structure

```
apps/web/              - Next.js app (UI + API routes)
packages/
  agents/chat/         - Streaming chat agent with searchDocsTool
  doc-scraper/         - Crawler + markdown scraper + vector storage
  shared/db/           - Site registry (Redis client)
  tools/docs-search/   - Semantic search tool (AI SDK tool)
mcp-server/            - MCP server for Cursor integration
```

### Data Storage (Upstash)

**Redis** - Site registry and metadata

- Keys: `sites` (set), `site:{domain}` (hash), `site:{domain}:discovered` (set), `site:{domain}:pages` (set)

**Vector** - Single index for all docs (1536 dims, cosine similarity)

- Metadata filtering by `source` field (domain)
- Documents stored as: `{id, data: content, metadata: {url, title, source, ...}}`

### Two-Stage Workflow

1. **Discovery**: Crawl max 1000 pages, depth 2, URLs only → `discovered` status
2. **Review**: User reviews discovered URLs
3. **Index**: Full scrape + markdown conversion + vector embeddings → `indexed` status

**Status states:** `pending` → `discovering` → `discovered` → `indexing` → `indexed` | `error`

## Key APIs & Patterns

### Site Registry (`@docs-hound/shared-db`)

```typescript
import { getSiteRegistry } from '@docs-hound/shared-db'

const registry = getSiteRegistry()
await registry.addSite(domain, metadata)
await registry.updateSite(domain, { status: 'indexing' })
await registry.setDiscoveredUrls(domain, urls)
await registry.addIndexedPage(domain, url)
```

### Document Storage (`@docs-hound/doc-scraper`)

```typescript
import { UpstashDocStorage, Crawler, scrapePageToMarkdown } from '@docs-hound/doc-scraper'

// Discovery
const crawler = new Crawler({ maxPages: 1000, maxDepth: 2, discoveryMode: true })
const urls = await crawler.discoverUrls(baseUrl)

// Indexing
const storage = new UpstashDocStorage()
const { markdown, title } = await scrapePageToMarkdown(url)
await storage.upsertDocuments([{ url, content: markdown, title, source, ... }], source)
```

### Search Tool (`@docs-hound/tool-docs-search`)

```typescript
import { searchDocsTool, searchDocs } from '@docs-hound/tool-docs-search'

// Direct usage
const results = await searchDocs(query, source?, limit?)

// As AI SDK tool (used in chat agent)
import { streamText } from 'ai'
const result = streamText({ model, tools: { searchDocs: searchDocsTool }, ... })
```

### Chat Agent (`@docs-hound/agent-chat`)

```typescript
import { runChatAgent } from '@docs-hound/agent-chat'

const response = await runChatAgent({ messages, source? })
// Returns streaming Response
```

## API Routes (apps/web/src/app/api/)

- `GET /api/sites` - List all sites
- `POST /api/sites` - Add new site (body: `{name, description, baseUrl}`)
- `GET /api/sites/[domain]` - Get site details + indexed pages
- `DELETE /api/sites/[domain]` - Delete site + vector data
- `POST /api/discover` - Start discovery (body: `{domain}`)
- `POST /api/index` - Start indexing (body: `{domain}`)
- `POST /api/chat` - Streaming chat (body: `{messages, selectedDomain?}`)
- `POST /api/mcp` - Hosted MCP server endpoint (requires `Authorization: Bearer <MCP_API_KEY>`)

## Environment Variables

Required in `apps/web/.env.local`:

```bash
OPENAI_API_KEY=sk-...
UPSTASH_VECTOR_REST_URL=https://...
UPSTASH_VECTOR_REST_TOKEN=...
# Vercel uses KV_REST_API_URL, local dev uses UPSTASH_REDIS_REST_URL
KV_REST_API_URL=https://...  # or UPSTASH_REDIS_REST_URL
KV_REST_API_TOKEN=...        # or UPSTASH_REDIS_REST_TOKEN
```

Optional (for hosted MCP server):

```bash
MCP_API_KEY=...  # Set in Vercel for hosted MCP endpoint authentication
```

Optional (for UI password protection):

```bash
UI_PASSWORD=...  # Set to protect the web UI with a password
```

See `docs/ENVIRONMENT_VARIABLES.md` for full details.

## Common Tasks

### Add New Package

1. Create in `packages/{category}/{name}/`
2. Add `package.json` with name `@docs-hound/{category}-{name}`
3. Set `"type": "module"`, `"main": "./src/index.ts"`
4. Copy `tsconfig.json` and `eslint.config.js` from existing package
5. Run `pnpm install` from root

### Import Workspace Package

In `package.json` dependencies:

```json
"@docs-hound/package-name": "workspace:*"
```

### Run Commands

- `pnpm dev` - Start all in dev mode (Turbo)
- `pnpm build` - Build all packages
- `pnpm typecheck` - Type check all
- `pnpm lint` - ESLint (zero warnings policy)
- `pnpm format` - Prettier format

## Important Constraints

1. **Discovery Limit**: Hard cap at 1000 pages in discovery mode
2. **Vector Query Limit**: Upstash free tier limits query results to 1000 (causes delete issues if >1000 docs per source)
3. **Depth Limiting**: Default max depth = 2 from base URL
4. **Embeddings**: Uses OpenAI text-embedding-3-small (1536 dimensions)
5. **Lodash Imports**: Always use `lodash-es` (not `lodash`)
6. **Test Setup**: Never add `vi.clearAllMocks()` to tests (auto-applied in setup)

## Code Patterns

### Error Handling

```typescript
try {
  // operation
} catch (error: unknown) {
  const err = error as { message?: string }
  console.error('[Component] Error:', err.message)
  throw error
}
```

### Logging Convention

```typescript
console.log('[ComponentName] Action description')
console.log('[ComponentName] ✓ Success message')
console.error('[ComponentName] ✗ Error message')
```

### Async Batch Processing

```typescript
const batchSize = 100
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize)
  await processFunction(batch)
  console.log(
    `✓ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`
  )
}
```

### Crawler Deduplication

The crawler uses three sets for efficient URL tracking:

- `visited` - URLs that have been crawled
- `queued` - URLs added to queue (prevents duplicate tasks)
- `discovered` - URLs found but not crawled (due to maxPages limit)

This prevents the same URL from being queued multiple times when found on different pages.

## MCP Server

The MCP server provides tools for AI agents (like Cursor) to search documentation. It can run in two modes:

1. **Local Mode (stdio)**: Runs locally via command line
2. **Hosted Mode (HTTP)**: Runs as an API endpoint on Vercel

### Available Tools

- `search_docs(query, source?, limit?)` - Semantic search
- `list_sources()` - List indexed sites
- `get_source_info(domain)` - Site details

### Local MCP Server Setup

Configure in Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "docs-hound-local": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/docs-hound/mcp-server/src/index.ts"],
      "cwd": "/absolute/path/to/docs-hound",
      "env": {
        "OPENAI_API_KEY": "...",
        "KV_REST_API_URL": "...",
        "KV_REST_API_TOKEN": "...",
        "UPSTASH_VECTOR_REST_URL": "...",
        "UPSTASH_VECTOR_REST_TOKEN": "..."
      }
    }
  }
}
```

**Important**: Use absolute paths for both `cwd` and in the `args` array. The MCP server automatically sets `MCP_MODE=true` to suppress info logs from stdout.

### Hosted MCP Server Setup

The hosted MCP server runs as an API endpoint at `/api/mcp` and uses simple Bearer token authentication.

**1. Set `MCP_API_KEY` in Vercel:**

- Go to Vercel Dashboard → Settings → Environment Variables
- Add `MCP_API_KEY` with a secure random value (e.g., generated via `openssl rand -base64 32`)
- Redeploy your application

**2. Configure in Cursor (`~/.cursor/mcp.json`):**

```json
{
  "mcpServers": {
    "docs-hound-hosted": {
      "url": "https://your-app.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer your-mcp-api-key-here"
      }
    }
  }
}
```

**3. You can have both local and hosted servers configured:**

```json
{
  "mcpServers": {
    "docs-hound-local": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/docs-hound/mcp-server/src/index.ts"],
      "cwd": "/absolute/path/to/docs-hound",
      "env": { ... }
    },
    "docs-hound-hosted": {
      "url": "https://your-app.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer your-mcp-api-key-here"
      }
    }
  }
}
```

### Implementation Details

The MCP server is split into two independent implementations:

- `mcp-server/src/mcp-handler.ts` - Core MCP server logic (for local stdio mode)
- `mcp-server/src/index.ts` - Local stdio transport
- `apps/web/src/app/api/mcp/route.ts` - Hosted HTTP endpoint (direct JSON-RPC handler)

The hosted endpoint implements the MCP JSON-RPC protocol directly without using the SDK server wrapper, making it more suitable for serverless deployments where creating persistent server instances isn't ideal.

## Known Issues

1. **No Auth**: Currently no authentication/multi-tenancy
2. **JS-only Crawling**: Sites using JavaScript rendering not supported (no headless browser)
3. **No Incremental Updates**: Full re-index required, no delta updates

## Dependencies

Core:

- `ai@6.0.3` - Vercel AI SDK
- `@ai-sdk/openai@^2.0.0` - OpenAI provider
- `@upstash/redis@^1.34.0` - Redis client
- `@upstash/vector@^1.2.2` - Vector client
- `@mantine/core@^8.3.9` - UI components
- `next@~16.0.7`, `react@~19.0.1` - Framework

Build:

- `turbo@^2.0.0` - Monorepo orchestration
- `typescript@^5.7.0` - Type checking
- `vitest@^2.0.0` - Testing

## Quick Reference

**Start site indexing:**

1. POST `/api/sites` with `{name, description, baseUrl}`
2. POST `/api/discover` with `{domain}` (wait for `discovered` status)
3. POST `/api/index` with `{domain}` (wait for `indexed` status)

**Search indexed docs:**

```typescript
import { searchDocs } from '@docs-hound/tool-docs-search'
const results = await searchDocs('query', 'domain.com', 5)
```

**Chat with docs:**

```typescript
import { runChatAgent } from '@docs-hound/agent-chat'
const stream = await runChatAgent({
  messages: [{ role: 'user', content: 'question' }],
  source: 'domain.com', // optional
})
```
