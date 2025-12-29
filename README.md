# Docs Hound

A documentation search and indexing platform that allows you to crawl, index, and semantically search any documentation site. Includes an MCP (Model Context Protocol) server for integration with AI coding assistants like Cursor.

## Overview

Docs Hound solves the problem of making external documentation accessible to AI agents. Instead of relying on AI's training data (which may be outdated), Docs Hound allows you to:

1. **Index any documentation site** - Add URLs, preview discovered pages, then index
2. **Semantic search** - Find relevant content using natural language queries
3. **Chat with docs** - Ask questions and get answers with source citations
4. **AI agent integration** - Expose documentation to Cursor and other MCP-compatible agents

## Features

| Feature                | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| **Two-Stage Indexing** | Preview discovered URLs before indexing to ensure quality |
| **1000 Page Limit**    | Discovery caps at 1000 pages to prevent runaway crawls    |
| **Semantic Search**    | Vector-based search using OpenAI embeddings               |
| **Source Filtering**   | Search all docs or filter by specific documentation site  |
| **Streaming Chat**     | Real-time AI responses with documentation context         |
| **MCP Server**         | Standards-compliant endpoint for AI agent tools           |
| **Status Polling**     | Live updates during discovery and indexing                |

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docs Hound                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Web UI    │    │ MCP Server  │    │  Chat API   │          │
│  │  (Next.js)  │    │   (stdio)   │    │ (streaming) │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                   ┌────────┴────────┐                            │
│                   │   Search Tool   │                            │
│                   └────────┬────────┘                            │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                  │
│         │                  │                  │                  │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐          │
│  │   Crawler   │    │  Upstash    │    │  Upstash    │          │
│  │  (scraper)  │    │   Vector    │    │   Redis     │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User adds URL → Discovery Crawl → URL Review → Full Index → Searchable
     │                │               │              │            │
     ▼                ▼               ▼              ▼            ▼
  pending →      discovering →   discovered →   indexing →    indexed
```

### Storage Strategy

Docs Hound uses **Upstash** for all storage needs:

| Storage    | Purpose                                  | Key Pattern                                 |
| ---------- | ---------------------------------------- | ------------------------------------------- |
| **Redis**  | Site registry, metadata, discovered URLs | `site:{domain}`, `site:{domain}:discovered` |
| **Vector** | Document embeddings for semantic search  | Single index with `source` metadata filter  |

**Why a single Vector index?**

- Unified cross-documentation search
- Simpler infrastructure (one Upstash Vector database)
- Lower cost on free tier
- Source filtering via metadata when needed

## Project Structure

```
docs-hound/
├── apps/
│   └── web/                        # Next.js 16 + React 19 web application
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx        # Dashboard - list all sites
│       │   │   ├── chat/           # Chat interface
│       │   │   ├── settings/       # MCP configuration
│       │   │   ├── sites/
│       │   │   │   ├── new/        # Add new site form
│       │   │   │   └── [domain]/   # Site detail with workflow
│       │   │   └── api/
│       │   │       ├── chat/       # Streaming chat endpoint
│       │   │       ├── discover/   # Start preview crawl
│       │   │       ├── index/      # Start full indexing
│       │   │       └── sites/      # Site CRUD operations
│       │   └── components/
│       │       ├── ChatInterface.tsx
│       │       ├── DeleteSiteButton.tsx
│       │       ├── DiscoveredUrlsList.tsx
│       │       ├── IndexedPagesList.tsx
│       │       └── SiteStatusPoller.tsx
│       └── package.json
│
├── packages/
│   ├── agents/
│   │   └── chat/                   # Chat agent with tool integration
│   │       └── src/index.ts        # runChatAgent() with searchDocsTool
│   │
│   ├── doc-scraper/                # Web crawling and content extraction
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── crawler.ts      # URL discovery with depth limiting
│   │       │   └── smart-scraper.ts # Content extraction (Readability + Turndown)
│   │       └── storage/
│   │           └── upstash.ts      # Vector storage with embeddings
│   │
│   ├── shared/
│   │   └── db/                     # Site registry (Upstash Redis)
│   │       └── src/
│   │           ├── redis-client.ts # SiteRegistry class
│   │           └── types.ts        # Site, SiteMetadata types
│   │
│   └── tools/
│       └── docs-search/            # Semantic search tool
│           └── src/
│               ├── index.ts        # searchDocsTool definition
│               └── lib/
│                   └── search-client.ts # Upstash Vector query
│
├── mcp-server/                     # MCP server for Cursor integration
│   └── src/index.ts                # search_docs, list_sources, get_source_info
│
├── turbo.json                      # Turborepo task configuration
├── pnpm-workspace.yaml             # pnpm workspace definition
└── package.json                    # Root scripts and dependencies
```

## Getting Started

### Prerequisites

- **Node.js 20+** - Required for Next.js 16
- **pnpm 9+** - Package manager (workspaces)
- **Upstash Account** - For Redis and Vector databases
- **OpenAI API Key** - For embeddings and chat

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd docs-hound

# Install dependencies
pnpm install

# Set up environment variables (choose one method):

# Method 1: Pull from Vercel (if you have a linked Vercel project)
pnpm env:pull

# Method 2: Copy from template and edit manually
cp env.template apps/web/.env.local
# Edit apps/web/.env.local with your credentials

# Start development server
pnpm dev
```

### Environment Variables

Create a `apps/web/.env.local` file with the following:

```env
# OpenAI - Required for embeddings and chat
OPENAI_API_KEY=sk-...

# Upstash Vector - Single index for all documentation
UPSTASH_VECTOR_REST_URL=https://...upstash.io
UPSTASH_VECTOR_REST_TOKEN=...

# Upstash Redis - Site registry and metadata
# For local dev, use UPSTASH_REDIS_* naming
# Vercel uses KV_REST_API_URL and KV_REST_API_TOKEN (code supports both)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# QStash - Optional, for background job processing
QSTASH_TOKEN=...

# Security - Optional
CRON_SECRET=...
MCP_API_KEY=...
```

> **Important**: In this monorepo, the `.env.local` file must be placed in `apps/web/.env.local` (not in the root directory) so Next.js can find it.

#### Pulling Environment Variables from Vercel

If you have a Vercel project linked to this repository, you can automatically pull environment variables:

```bash
# From the project root
pnpm env:pull
```

This runs `vercel env pull --yes apps/web/.env.local` which:

1. Connects to your Vercel project
2. Downloads all environment variables for the development environment
3. Saves them to `apps/web/.env.local` (the correct location for Next.js)

**Prerequisites for `env:pull`:**

- Vercel CLI installed globally: `npm i -g vercel`
- Authenticated with Vercel: `vercel login`
- Project linked to Vercel: `vercel link` (or deployed at least once)

> **Note for Vercel Deployments**: When using Vercel Upstash integrations, Vercel automatically sets:
>
> - Redis: `KV_REST_API_URL`, `KV_REST_API_TOKEN` (and other KV\_\* variables)
> - Vector: `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`
> - QStash: `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`
>
> The code supports both Vercel's `KV_*` naming and the `UPSTASH_REDIS_*` naming for Redis.

### Creating Upstash Resources

1. **Create Upstash Vector Index:**
   - Go to [Upstash Console](https://console.upstash.com)
   - Create a new Vector database
   - Select **1536 dimensions** (for OpenAI embeddings)
   - Choose **Cosine** similarity metric
   - Copy the REST URL and Token

2. **Create Upstash Redis Database:**
   - In Upstash Console, create a new Redis database
   - Copy the REST URL and Token

## Usage Guide

### Adding a Documentation Site

1. **Navigate to Dashboard** - Open `http://localhost:3000`
2. **Click "Add Site"** - Enter the documentation URL (e.g., `https://docs.example.com`)
3. **Review Site Details** - Confirm the name, description, and base URL
4. **Start Discovery** - Click "Start Discovery" to begin crawling

### Two-Stage Indexing Workflow

The indexing process has two stages to ensure quality:

#### Stage 1: Discovery (Preview Crawl)

When you start discovery:

- The crawler visits the base URL
- It follows internal links to discover pages
- **Maximum 1000 pages** are discovered (to prevent runaway crawls)
- **Maximum depth of 2** levels from the base URL
- Only URLs on the same domain are discovered

The site status changes: `pending` → `discovering` → `discovered`

#### Stage 2: Review & Index

After discovery completes:

- You see the list of discovered URLs
- Review and confirm the pages look correct
- Click "Start Indexing" to begin full content extraction
- Each page is scraped, converted to markdown, and embedded

The site status changes: `discovered` → `indexing` → `indexed`

### Site Status States

| Status        | Description                      | Next Action         |
| ------------- | -------------------------------- | ------------------- |
| `pending`     | Site added, ready for discovery  | Start Discovery     |
| `discovering` | Crawling in progress             | Wait for completion |
| `discovered`  | URLs found, awaiting review      | Review & Index      |
| `indexing`    | Content being extracted/embedded | Wait for completion |
| `indexed`     | Ready for search                 | Chat or Re-discover |
| `error`       | Something failed                 | Check logs, Retry   |

### Chatting with Documentation

1. **Navigate to Chat** - Click "Chat with Docs" or go to `/chat`
2. **Select a Source** (optional) - Filter to a specific documentation site
3. **Ask Questions** - Type natural language questions
4. **Get Answers** - AI searches documentation and synthesizes responses

### Using the MCP Server with Cursor

The MCP server allows Cursor (and other MCP-compatible agents) to search your indexed documentation.

#### Configuration

Add to your Cursor settings (`.cursor/mcp.json` or via Settings):

```json
{
  "mcpServers": {
    "docs-hound": {
      "command": "npx",
      "args": ["tsx", "mcp-server/src/index.ts"],
      "cwd": "/path/to/docs-hound",
      "env": {
        "OPENAI_API_KEY": "your-key",
        "KV_REST_API_URL": "your-redis-url",
        "KV_REST_API_TOKEN": "your-redis-token",
        "UPSTASH_VECTOR_REST_URL": "your-vector-url",
        "UPSTASH_VECTOR_REST_TOKEN": "your-vector-token"
      }
    }
  }
}
```

> **Note**: When using Vercel, copy these exact variable names and values from your Vercel Environment Variables. For local development, you can use `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` instead of the `KV_*` names (code supports both).

#### Available MCP Tools

| Tool              | Description                          | Parameters                                                             |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `search_docs`     | Semantic search across documentation | `query` (string), `source` (optional string), `topK` (optional number) |
| `list_sources`    | List all indexed documentation sites | None                                                                   |
| `get_source_info` | Get details about a specific source  | `domain` (string)                                                      |

#### Example Usage in Cursor

Once configured, you can ask Cursor:

> "Search the documentation for how to configure authentication"

Cursor will use the `search_docs` tool to find relevant content.

## API Reference

### REST Endpoints

#### Sites API

```
GET    /api/sites              # List all sites
POST   /api/sites              # Add new site
GET    /api/sites/[domain]     # Get site details
DELETE /api/sites/[domain]     # Delete site and its data
```

#### Discovery API

```
POST   /api/discover           # Start discovery crawl
       Body: { domain: string }
```

#### Indexing API

```
POST   /api/index              # Start full indexing
       Body: { domain: string }
```

#### Chat API

```
POST   /api/chat               # Streaming chat
       Body: {
         messages: Array<{role: 'user'|'assistant', content: string}>,
         selectedDomain?: string
       }
```

### Package APIs

#### @docs-hound/shared-db

```typescript
import {
  getSiteRegistry,
  type Site,
  type SiteMetadata,
} from '@docs-hound/shared-db'

const registry = getSiteRegistry()

// Site operations
await registry.addSite(domain, metadata)
await registry.getSite(domain)
await registry.updateSite(domain, updates)
await registry.deleteSite(domain)
await registry.listSites()

// Discovery operations
await registry.setDiscoveredUrls(domain, urls)
await registry.getDiscoveredUrls(domain)

// Indexing operations
await registry.addIndexedPage(domain, url)
await registry.getIndexedPages(domain)
```

#### @docs-hound/doc-scraper

```typescript
import {
  Crawler,
  scrapePageToMarkdown,
  UpstashDocStorage,
} from '@docs-hound/doc-scraper'

// Discover URLs
const crawler = new Crawler({ maxPages: 1000, maxDepth: 2 })
const urls = await crawler.discoverUrls('https://docs.example.com')

// Scrape content
const { markdown, title } = await scrapePageToMarkdown(url)

// Store in vector database
const storage = new UpstashDocStorage()
await storage.upsertDocument({
  url,
  content: markdown,
  title,
  source: 'docs.example.com',
})
```

#### @docs-hound/tool-docs-search

```typescript
import { searchDocsTool, searchUpstash } from '@docs-hound/tool-docs-search'

// Direct search
const results = await searchUpstash({
  query: 'authentication setup',
  source: 'docs.example.com', // optional
  topK: 5,
})

// As AI SDK tool
import { generateText } from 'ai'
const result = await generateText({
  model: openai('gpt-4o'),
  tools: { searchDocs: searchDocsTool },
  prompt: 'Find information about authentication',
})
```

#### @docs-hound/agent-chat

```typescript
import { runChatAgent, type ChatMessage } from '@docs-hound/agent-chat'

const response = await runChatAgent({
  messages: [{ role: 'user', content: 'How do I authenticate?' }],
  source: 'docs.example.com', // optional filter
})
// Returns a streaming Response
```

## Development

### Scripts

| Script              | Description                            |
| ------------------- | -------------------------------------- |
| `pnpm dev`          | Start all packages in development mode |
| `pnpm build`        | Build all packages for production      |
| `pnpm typecheck`    | Run TypeScript type checking           |
| `pnpm lint`         | Run ESLint with zero warnings policy   |
| `pnpm format`       | Format code with Prettier              |
| `pnpm format:check` | Check code formatting                  |
| `pnpm test`         | Run tests with Vitest                  |

### Quality Checks

Before committing, run all checks:

```bash
pnpm typecheck && pnpm lint && pnpm format:check
```

This is enforced by Husky pre-commit hooks.

### Adding a New Package

1. Create the package directory:

   ```bash
   mkdir -p packages/tools/my-tool
   cd packages/tools/my-tool
   ```

2. Create `package.json`:

   ```json
   {
     "name": "@docs-hound/tool-my-tool",
     "version": "0.1.0",
     "type": "module",
     "private": true,
     "main": "./src/index.ts",
     "exports": { ".": "./src/index.ts" },
     "scripts": {
       "lint": "eslint . --max-warnings=0",
       "typecheck": "tsc --noEmit",
       "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
       "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
       "test": "vitest run"
     }
   }
   ```

3. Create `tsconfig.json` and `eslint.config.js` (copy from existing package)

4. Install dependencies:
   ```bash
   cd ../../../
   pnpm install
   ```

### Conventional Commits

Use conventional commit messages:

```bash
feat(web): add site deletion confirmation dialog
fix(scraper): handle timeout errors gracefully
docs: update MCP configuration instructions
chore(deps): update ai-sdk to v6.0.4
```

## Troubleshooting

### Common Issues

#### "Missing environment variables" during build

The build process runs server components which need environment variables. Solutions:

- Ensure `.env.local` exists with all required variables
- For CI/CD, set environment variables in your pipeline

#### Discovery finds too few pages

- Check that the base URL is correct (try adding `/docs` or `/documentation`)
- Ensure the site doesn't require authentication
- Some sites use JavaScript rendering (not currently supported)

#### Chat returns "No relevant documentation found"

- Verify the site is fully indexed (status = `indexed`)
- Check that the Upstash Vector database has documents
- Try a more specific or different query

#### MCP server not connecting

- Verify the path to `mcp-server/src/index.ts` is correct
- Check that all environment variables are set in the MCP config
- Look at Cursor's MCP logs for error messages

### Debug Mode

Enable verbose logging by setting:

```env
DEBUG=docs-hound:*
```

## Technology Stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| **Frontend** | Next.js 16, React 19, Mantine UI                      |
| **Backend**  | Next.js API Routes, Server Components                 |
| **Database** | Upstash Redis (metadata), Upstash Vector (embeddings) |
| **AI**       | OpenAI GPT-4o (chat), OpenAI Embeddings (search)      |
| **MCP**      | @modelcontextprotocol/sdk                             |
| **Build**    | Turborepo, pnpm workspaces                            |
| **Quality**  | TypeScript, ESLint, Prettier, Husky                   |

## License

Private - Internal use only
