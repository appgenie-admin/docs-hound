# Docs Hound

Documentation search and indexing platform with MCP integration for AI agents.

## Features

- **Web UI** - Manage documentation sites, view indexing status, chat with docs
- **MCP Server** - Model Context Protocol endpoint for Cursor and other AI agents
- **Automated Crawling** - On-demand crawling with preview before indexing
- **Semantic Search** - Vector-based search across all indexed documentation

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Upstash account (for Redis and Vector)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp env.template .env.local

# Start development server
pnpm dev
```

### Environment Variables

See `env.template` for required environment variables.

## Project Structure

```
docs-hound/
├── apps/
│   └── web/                    # Next.js web application
├── packages/
│   ├── agents/
│   │   └── chat/               # Chat agent for documentation Q&A
│   ├── doc-scraper/            # Web crawler and content extraction
│   ├── shared/
│   │   └── db/                 # Upstash Redis client
│   └── tools/
│       └── docs-search/        # Semantic search tool
├── mcp-server/                 # MCP server for AI agent integration
└── turbo.json                  # Turborepo configuration
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build all packages
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests

## License

Private - Internal use only
