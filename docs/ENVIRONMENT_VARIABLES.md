# Environment Variables Reference

This document explains the environment variables used by Docs Hound and how they differ between local development and Vercel deployment.

## Variable Naming Conventions

### Vercel Integration Names (When Using Vercel + Upstash Integrations)

When you add Upstash integrations through Vercel's marketplace, Vercel automatically creates these environment variables:

#### Redis (from Upstash Redis Integration)

- `KV_REST_API_URL` - Redis REST API endpoint ✅ **Used by app**
- `KV_REST_API_TOKEN` - Redis REST API token (read/write) ✅ **Used by app**
- `KV_REST_API_READ_ONLY_TOKEN` - Redis REST API token (read-only)
- `KV_URL` - Redis connection string (rediss://)
- `REDIS_URL` - Alternative Redis connection string

#### Vector (from Upstash Vector Integration)

- `UPSTASH_VECTOR_REST_URL` - Vector database REST API endpoint ✅ **Used by app**
- `UPSTASH_VECTOR_REST_TOKEN` - Vector database REST API token ✅ **Used by app**
- `UPSTASH_VECTOR_REST_READONLY_TOKEN` - Vector database read-only token

#### QStash (from Upstash QStash Integration - Optional)

- `QSTASH_URL` - QStash API endpoint
- `QSTASH_TOKEN` - QStash API token ✅ **Used by app (if QStash enabled)**
- `QSTASH_CURRENT_SIGNING_KEY` - Current webhook signing key
- `QSTASH_NEXT_SIGNING_KEY` - Next webhook signing key (for rotation)

#### Other Vercel Variables

- `VERCEL_OIDC_TOKEN` - Vercel's OIDC token (automatically provided)

### Local Development Names

For local development or manual Upstash setup, use these variable names in your `.env.local`:

#### Redis

- `UPSTASH_REDIS_REST_URL` - Redis REST API endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Redis REST API token

#### Vector

- `UPSTASH_VECTOR_REST_URL` - Vector database REST API endpoint
- `UPSTASH_VECTOR_REST_TOKEN` - Vector database REST API token

## How the Code Handles Different Naming

### Redis (Dual Support)

The Redis client supports **both** naming conventions with fallback logic:

```typescript
// From packages/shared/db/src/redis-client.ts
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
```

**Priority:**

1. First checks for `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Vercel naming)
2. Falls back to `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (local naming)

### Vector (Single Naming)

The Vector storage uses the **same naming** in both Vercel and local environments:

```typescript
// From packages/doc-scraper/src/storage/upstash.ts
const url = process.env.UPSTASH_VECTOR_REST_URL
const token = process.env.UPSTASH_VECTOR_REST_TOKEN
```

**Why?** Vercel's Upstash Vector integration uses `UPSTASH_VECTOR_*` naming consistently.

## Complete Environment Variable List

### Required Variables

| Variable       | Vercel Name                 | Local Name                  | Purpose                            |
| -------------- | --------------------------- | --------------------------- | ---------------------------------- |
| OpenAI API Key | `OPENAI_API_KEY`            | `OPENAI_API_KEY`            | Generate embeddings and power chat |
| Redis URL      | `KV_REST_API_URL`           | `UPSTASH_REDIS_REST_URL`    | Site metadata storage              |
| Redis Token    | `KV_REST_API_TOKEN`         | `UPSTASH_REDIS_REST_TOKEN`  | Site metadata access               |
| Vector URL     | `UPSTASH_VECTOR_REST_URL`   | `UPSTASH_VECTOR_REST_URL`   | Document embeddings storage        |
| Vector Token   | `UPSTASH_VECTOR_REST_TOKEN` | `UPSTASH_VECTOR_REST_TOKEN` | Document embeddings access         |

### Optional Variables

| Variable            | Vercel Name                                             | Purpose                        | When Needed                            |
| ------------------- | ------------------------------------------------------- | ------------------------------ | -------------------------------------- |
| QStash Token        | `QSTASH_TOKEN`                                          | Background job processing      | Production deployments with large docs |
| QStash URL          | `QSTASH_URL`                                            | QStash API endpoint            | Automatically provided by integration  |
| QStash Signing Keys | `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | Webhook signature verification | Automatically provided by integration  |
| Cron Secret         | `CRON_SECRET`                                           | Secure cron endpoints          | If you add scheduled tasks             |
| MCP API Key         | `MCP_API_KEY`                                           | Secure hosted MCP server       | When using remote MCP server endpoint  |

### Auto-Provided Variables (Vercel Only)

These are automatically set by Vercel integrations but not directly used by the application:

- `KV_REST_API_READ_ONLY_TOKEN` - Read-only Redis token
- `KV_URL` - Redis connection string
- `REDIS_URL` - Alternative Redis connection string
- `UPSTASH_VECTOR_REST_READONLY_TOKEN` - Read-only Vector token
- `VERCEL_OIDC_TOKEN` - Vercel's OIDC authentication token

## Setup Instructions

### For Local Development

#### Option 1: Pull from Vercel (Recommended if deployed)

If you have a Vercel project deployed, you can automatically pull all environment variables:

```bash
# Make sure you're in the project root
cd /path/to/docs-hound

# Pull environment variables from Vercel
pnpm env:pull
```

This will:

1. Connect to your Vercel project
2. Download environment variables for the development environment
3. Save them to `apps/web/.env.local` automatically

**Prerequisites:**

- Vercel CLI installed: `npm i -g vercel`
- Authenticated: `vercel login`
- Project linked: `vercel link` (or deployed at least once)

#### Option 2: Manual Setup

1. Copy `env.template` to `apps/web/.env.local` (not root!)
2. Get credentials from [Upstash Console](https://console.upstash.com)
3. Use the **local naming** (`UPSTASH_*` for all services)
4. Fill in all required variables

```bash
cp env.template apps/web/.env.local
# Edit apps/web/.env.local with your credentials
```

> **Important**: In this monorepo, the `.env.local` file must be in `apps/web/.env.local` (where the Next.js app is) so Next.js can find it during development.

**Example `apps/web/.env.local` for local development:**

```env
OPENAI_API_KEY=sk-...
UPSTASH_VECTOR_REST_URL=https://...upstash.io
UPSTASH_VECTOR_REST_TOKEN=...
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### For Vercel Deployment

1. Add Upstash integrations through Vercel marketplace:
   - Upstash Redis (creates `KV_*` variables)
   - Upstash Vector (creates `UPSTASH_VECTOR_*` variables)
   - (Optional) Upstash QStash (creates `QSTASH_*` variables)
2. Manually add `OPENAI_API_KEY` via Vercel dashboard
3. Vercel automatically sets all other variables!

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

**Vercel will automatically provide:**

```
# Redis (from integration)
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
KV_URL=rediss://...
REDIS_URL=rediss://...

# Vector (from integration)
UPSTASH_VECTOR_REST_URL=https://...upstash.io
UPSTASH_VECTOR_REST_TOKEN=...
UPSTASH_VECTOR_REST_READONLY_TOKEN=...

# QStash (from integration, if added)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...

# Vercel system
VERCEL_OIDC_TOKEN=...
```

### For MCP Server

The MCP server can run in two modes: **local** (stdio) or **hosted** (HTTP).

#### Local MCP Server (stdio)

For local development, set environment variables in your Cursor config (`~/.cursor/mcp.json`).

**Use the variable names that match your setup:**

**If Using Vercel credentials (copy from Vercel Environment Variables):**

```json
{
  "mcpServers": {
    "docs-hound-local": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/docs-hound/mcp-server/src/index.ts"],
      "cwd": "/absolute/path/to/docs-hound",
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "KV_REST_API_URL": "https://...",
        "KV_REST_API_TOKEN": "...",
        "UPSTASH_VECTOR_REST_URL": "https://...",
        "UPSTASH_VECTOR_REST_TOKEN": "..."
      }
    }
  }
}
```

**If Using Local Upstash:**

```json
{
  "mcpServers": {
    "docs-hound-local": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/docs-hound/mcp-server/src/index.ts"],
      "cwd": "/absolute/path/to/docs-hound",
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "UPSTASH_REDIS_REST_URL": "https://...",
        "UPSTASH_REDIS_REST_TOKEN": "...",
        "UPSTASH_VECTOR_REST_URL": "https://...",
        "UPSTASH_VECTOR_REST_TOKEN": "..."
      }
    }
  }
}
```

#### Hosted MCP Server (HTTP)

For remote access, configure the HTTP endpoint in Cursor:

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

**Required Vercel environment variable:**

- `MCP_API_KEY` - Set this in Vercel dashboard (Settings → Environment Variables)
- Use the same value in the `Authorization` header above

**You can have both local and hosted servers configured simultaneously.**

## Troubleshooting

### "Missing required environment variables" Error

If you see this error, check:

1. **Is the `.env.local` file in the right place?**
   - For local development: Must be in `apps/web/.env.local` (NOT in root!)
   - Vercel deployment: Environment variables are set in Vercel dashboard

2. **Which environment are you in?**
   - Vercel deployment → Should have `KV_*` for Redis, `UPSTASH_VECTOR_*` for Vector
   - Local development → Should have `UPSTASH_*` for both

3. **Are the variables set?**
   - Vercel: Check Settings → Environment Variables
   - Local: Check `apps/web/.env.local` file exists and has values
   - MCP: Check your `.cursor/mcp.json` file

4. **Did you redeploy after adding variables?** (Vercel only)
   - Vercel requires redeployment for env var changes to take effect
   - Go to Deployments → Click "..." → Redeploy

### Variables Not Showing in Vercel

If Upstash integration variables aren't appearing:

1. Verify the integration is installed (Settings → Integrations)
2. Check the integration was linked to the correct project
3. Try removing and re-adding the integration
4. Variables should appear immediately after successful integration

### Wrong Variable Names

**Redis naming confusion:**

- ✅ Vercel uses `KV_REST_API_URL` / `KV_REST_API_TOKEN`
- ✅ Local uses `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- ✅ Code supports both automatically

**Vector naming is consistent:**

- ✅ Both Vercel and local use `UPSTASH_VECTOR_REST_URL` / `UPSTASH_VECTOR_REST_TOKEN`

### MCP Server Can't Connect

1. Verify you're using the correct variable names for your setup
2. Check that all 5 required variables are set:
   - `OPENAI_API_KEY`
   - Redis URL (either `KV_REST_API_URL` or `UPSTASH_REDIS_REST_URL`)
   - Redis Token (either `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_TOKEN`)
   - `UPSTASH_VECTOR_REST_URL`
   - `UPSTASH_VECTOR_REST_TOKEN`
3. Restart Cursor after updating the MCP config

## Migration Guide

### From Manual Upstash to Vercel Integrations

If you're migrating from manual Upstash setup to Vercel integrations:

1. **Add Vercel Upstash integrations** (see VERCEL_DEPLOYMENT.md)
2. **Verify new variables appear** in Vercel Environment Variables
3. **Redeploy** and test
4. **Don't remove old variables immediately** - code supports both
5. Once working, you can clean up old `UPSTASH_REDIS_*` variables (but keep `UPSTASH_VECTOR_*`)

**What changes:**

- `UPSTASH_REDIS_REST_URL` → `KV_REST_API_URL` (or keep both)
- `UPSTASH_REDIS_REST_TOKEN` → `KV_REST_API_TOKEN` (or keep both)
- `UPSTASH_VECTOR_*` stays the same ✅

**Update your MCP config to use the new Redis variable names.**

## Summary

### Quick Reference

**For Vercel deployments, you'll have:**

```
Required:
- OPENAI_API_KEY (manually added)
- KV_REST_API_URL (auto from Redis integration)
- KV_REST_API_TOKEN (auto from Redis integration)
- UPSTASH_VECTOR_REST_URL (auto from Vector integration)
- UPSTASH_VECTOR_REST_TOKEN (auto from Vector integration)

Optional:
- QSTASH_TOKEN (auto from QStash integration)
- + additional variables from each integration
```

**For local development, you need:**

```
Required:
- OPENAI_API_KEY
- UPSTASH_REDIS_REST_URL (from Upstash Console)
- UPSTASH_REDIS_REST_TOKEN (from Upstash Console)
- UPSTASH_VECTOR_REST_URL (from Upstash Console)
- UPSTASH_VECTOR_REST_TOKEN (from Upstash Console)
```

**Key Takeaway:**

- **Redis**: Vercel uses `KV_*`, local uses `UPSTASH_REDIS_*` (code supports both)
- **Vector**: Everyone uses `UPSTASH_VECTOR_*` (consistent naming)
- **QStash**: Vercel provides multiple variables, only `QSTASH_TOKEN` is used by app
