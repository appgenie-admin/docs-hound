# Hosted MCP Server

This document explains how to use the hosted MCP server endpoint.

## Overview

The hosted MCP server allows you to access Docs Hound's MCP tools remotely via HTTP instead of running a local process. This is useful for:

- Using Docs Hound from multiple machines without local setup
- Sharing access with team members
- Reducing local resource usage

## Setup

### 1. Deploy to Vercel

Follow the instructions in `docs/VERCEL_DEPLOYMENT.md` to deploy your Docs Hound instance.

### 2. Generate an API Key

Generate a secure random API key:

```bash
# macOS/Linux
openssl rand -base64 32

# Or any other secure random string generator
```

### 3. Add API Key to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name**: `MCP_API_KEY`
   - **Value**: Your generated API key
   - **Environment**: Production (and Preview/Development if needed)
4. Redeploy your application for the changes to take effect

### 4. Configure Cursor

Edit your Cursor MCP config at `~/.cursor/mcp.json`:

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

Replace:

- `https://your-app.vercel.app` with your actual Vercel URL
- `your-mcp-api-key-here` with the API key you generated

### 5. Restart Cursor

Restart Cursor to load the new MCP configuration.

## Using Both Local and Hosted

You can configure both local and hosted MCP servers simultaneously:

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

Cursor will show both servers in the MCP tools list.

## Security Notes

⚠️ **Important Security Considerations:**

1. **Keep your API key secret**: Never commit it to version control
2. **Use HTTPS**: The Vercel deployment automatically uses HTTPS
3. **Rotate keys**: If compromised, generate a new key and update Vercel
4. **Personal use only**: This simple Bearer token auth is suitable for personal use, not production multi-tenant applications

## Troubleshooting

### "Invalid API key" Error

- Verify the API key in Vercel matches the one in your Cursor config
- Make sure you redeployed after adding the environment variable
- Check there are no extra spaces in the Authorization header

### "MCP server not configured" Error

- The `MCP_API_KEY` environment variable is not set in Vercel
- Add it and redeploy

### Connection Timeout

- Check your Vercel deployment is running and accessible
- Verify the URL in your Cursor config is correct
- Check Vercel function logs for errors

### Tools Not Working

- Verify all required environment variables are set in Vercel:
  - `OPENAI_API_KEY`
  - `KV_REST_API_URL` / `KV_REST_API_TOKEN`
  - `UPSTASH_VECTOR_REST_URL` / `UPSTASH_VECTOR_REST_TOKEN`
- Check the Vercel function logs for specific errors

## API Details

### Endpoint

```
POST https://your-app.vercel.app/api/mcp
```

### Authentication

```
Authorization: Bearer <your-api-key>
```

### Request Format

Standard MCP JSON-RPC format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_docs",
    "arguments": {
      "query": "How do I configure authentication?",
      "limit": 5
    }
  }
}
```

### Response Format

Standard MCP JSON-RPC format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 5 relevant documentation pages:\n\n..."
      }
    ]
  }
}
```

## Implementation

The hosted MCP server implementation is a simple HTTP JSON-RPC handler:

- **HTTP endpoint**: `apps/web/src/app/api/mcp/route.ts` - Direct JSON-RPC handler
- **No server instance**: Handles JSON-RPC messages directly without the MCP SDK server wrapper
- **Stateless**: Each request is independent, no persistent connections

The hosted mode directly implements the MCP JSON-RPC protocol, making it more suitable for serverless deployments.
