# Vercel Deployment Guide

This guide walks you through deploying Docs Hound to Vercel with native Upstash integration.

## Overview

This deployment process follows these steps:

1. Fork the repository to your GitHub account
2. Set up a Vercel account and import the project
3. Add Upstash integration (Redis + Vector) directly through Vercel
4. (Optional) Configure OpenAI for web UI features

> **Note**: OpenAI is only required if you want to use the web interface for indexing and chat. The MCP server can search existing documentation without OpenAI.

## Prerequisites

- A [GitHub](https://github.com) account
- That's it! We'll create the other accounts as we go.

## Part 1: Fork the Repository

### Step 1: Fork to Your GitHub Account

1. Navigate to the Docs Hound repository on GitHub
2. Click the **"Fork"** button in the top-right corner
3. Select your account as the destination
4. Wait for the fork to complete
5. You now have your own copy at `github.com/YOUR_USERNAME/docs-hound`

> **Why fork?** This gives you full control over the codebase, allows you to make customizations, and enables Vercel to set up automatic deployments on push.

### Step 2: Clone to Your Local Machine (Optional)

If you want to develop locally:

```bash
git clone https://github.com/YOUR_USERNAME/docs-hound.git
cd docs-hound
pnpm install
```

## Part 2: Set Up Vercel Project

### Step 1: Create Vercel Account

1. Go to [Vercel](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

> **Tip**: Using GitHub authentication makes deployment setup seamless.

### Step 2: Import Your Forked Repository

1. From the [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New..."** → **"Project"**
2. Find your forked `docs-hound` repository in the list
3. Click **"Import"**

### Step 3: Configure Build Settings

Vercel will automatically detect this as a Turborepo + Next.js project. Configure the following:

#### Root Directory

- Click **"Edit"** next to Root Directory
- Select `apps/web` ⚠️ **CRITICAL**
- Click **"Continue"**

> **Why `apps/web`?** This is a monorepo, but we only deploy the web application. The root directory tells Vercel where the Next.js app lives.

#### Build & Development Settings

Leave these as detected defaults:

- **Framework Preset**: Next.js
- **Build Command**: `next build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `pnpm install` (auto-detected)

### Step 4: Initial Deployment

Click **"Deploy"** on the form.

> **Note**: The first deployment will likely fail due to missing environment variables - that's okay! We'll add Upstash integrations next and redeploy.

Wait for the deployment to attempt (it will take 2-3 minutes). Once it completes (even if it fails), you'll have access to the project dashboard where we can add integrations.

## Part 3: Add Upstash Integration (Native Vercel Integration)

Now that your project exists in Vercel, we can add the Upstash integrations. Vercel has native integrations with Upstash that automatically provision resources and inject environment variables.

### Step 1: Access Integrations

1. From your Vercel project dashboard (you should be here after the initial deployment)
2. Look in the top navigation for **"Marketplace"** or click on **"Integrations"** in the left sidebar
3. Or go directly to your project settings: **Settings** → **"Integrations"**

> **Tip**: If the deployment failed with "Missing environment variables", that's expected! We're fixing it now.

### Step 2: Add Upstash Redis Integration

1. In the Integrations marketplace or settings, search for **"Upstash Redis"**
2. Click on **"Upstash Redis"**
3. Click **"Add Integration"**
4. Select your Vercel account/team
5. Choose the project you just created (`docs-hound`)
6. Click **"Continue"**

You'll be redirected to Upstash:

7. **Sign up for Upstash** (if you don't have an account):
   - Click **"Continue with GitHub"** (recommended)
   - Or create an account with email
8. **Create Redis Database**:
   - **Name**: `docs-hound-registry`
   - **Type**: Regional (recommended for better performance)
   - **Region**: Choose region closest to your users (e.g., `us-east-1`)
   - Click **"Create"**
9. **Authorize Integration**:
   - Click **"Approve"** to link the database to Vercel
   - Environment variables are automatically added to your project! ✨

The following environment variables are now set automatically:

- `KV_REST_API_URL` - Redis REST API endpoint
- `KV_REST_API_TOKEN` - Redis REST API token (read/write)
- `KV_REST_API_READ_ONLY_TOKEN` - Read-only Redis token
- `KV_URL` - Redis connection string (rediss://)
- `REDIS_URL` - Alternative Redis connection string

> **Note**: The application uses `KV_REST_API_URL` and `KV_REST_API_TOKEN` for read/write access.

You'll be redirected back to Vercel.

### Step 3: Add Upstash Vector Integration

Now we need a Vector database for document embeddings:

1. Back in your Vercel project, go to **"Settings"** → **"Integrations"** (or use the Marketplace)
2. Search for **"Upstash Vector"**
3. Click **"Add Integration"**
4. Select your project
5. Click **"Continue"**

You'll be redirected to Upstash again:

6. **Create Vector Index**:
   - **Name**: `docs-hound`
   - **Dimensions**: `1536` ⚠️ **REQUIRED** (for OpenAI embeddings)
   - **Similarity Metric**: `COSINE`
   - **Region**: Choose the **same region** as your Redis database
   - Click **"Create"**
7. **Authorize Integration**:
   - Click **"Approve"**
   - Environment variables are automatically added! ✨

The following environment variables are now set automatically:

- `UPSTASH_VECTOR_REST_URL` - Vector database REST API endpoint
- `UPSTASH_VECTOR_REST_TOKEN` - Vector database REST API token (read/write)
- `UPSTASH_VECTOR_REST_READONLY_TOKEN` - Read-only Vector token

> **Note**: The application uses `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN` for read/write access.

You'll be redirected back to Vercel.

### Step 4: (Optional) Add QStash Integration

QStash enables background job processing for long-running tasks:

1. In Vercel project settings, go to **"Integrations"**
2. Search for **"Upstash QStash"**
3. Click **"Add Integration"**
4. Follow the same flow to authorize
5. QStash automatically adds these environment variables:
   - `QSTASH_URL` - QStash API endpoint
   - `QSTASH_TOKEN` - QStash API token
   - `QSTASH_CURRENT_SIGNING_KEY` - Current webhook signing key
   - `QSTASH_NEXT_SIGNING_KEY` - Next webhook signing key (for rotation)

> **Note**: QStash is optional but recommended for production deployments with large documentation sites.

### Step 5: Verify Environment Variables

Let's confirm all the integrations worked:

1. In your Vercel project, go to **"Settings"** → **"Environment Variables"**
2. You should see these variables from the Upstash integrations:

**From Redis Integration:**

- ✅ `KV_REST_API_URL`
- ✅ `KV_REST_API_TOKEN`
- ✅ `KV_REST_API_READ_ONLY_TOKEN`
- ✅ `KV_URL`
- ✅ `REDIS_URL`

**From Vector Integration:**

- ✅ `UPSTASH_VECTOR_REST_URL`
- ✅ `UPSTASH_VECTOR_REST_TOKEN`
- ✅ `UPSTASH_VECTOR_REST_READONLY_TOKEN`

**From QStash Integration (if added):**

- ✅ `QSTASH_URL`
- ✅ `QSTASH_TOKEN`
- ✅ `QSTASH_CURRENT_SIGNING_KEY`
- ✅ `QSTASH_NEXT_SIGNING_KEY`

If any required variables are missing, go back and re-add that integration.

## Part 4: Configure OpenAI (Required for All Features)

### Understanding Embeddings and Vector Search

**Important**: Upstash Vector is a vector database that **stores** embeddings, but does **NOT generate** them. You need an embedding model for:

1. **Indexing**: Convert text → embeddings → store in Upstash Vector
2. **Searching**: Convert query → embedding → find similar embeddings in Upstash

| Feature               | Needs OpenAI? | Why                                     |
| --------------------- | ------------- | --------------------------------------- |
| **Web UI - Indexing** | ✅ Yes        | Creates embeddings from documentation   |
| **Web UI - Chat**     | ✅ Yes        | Creates query embeddings + AI responses |
| **MCP Server Search** | ✅ Yes        | Creates embeddings from search queries  |
| **Any doc search**    | ✅ Yes        | Queries must be converted to embeddings |

### The Bottom Line

**OpenAI is required for all functionality**, including the MCP server. Even though the MCP server doesn't do indexing, it needs to convert each search query into an embedding before it can search the vector database.

### Setting Up OpenAI

You'll need an OpenAI API key:

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** → **"Create new secret key"**
4. Copy the key (starts with `sk-...`)
5. **Add to Vercel**:
   - Go to your Vercel project
   - **Settings** → **"Environment Variables"**
   - Add variable:
     - **Name**: `OPENAI_API_KEY`
     - **Value**: Your API key (paste it)
     - **Environment**: Select "Production", "Preview", and "Development"
   - Click **"Save"**

> **Cost**: OpenAI charges per API call:
>
> - **text-embedding-3-small** (for embeddings): ~$0.02 per 1M tokens
> - **GPT-4o** (for chat): ~$2.50-$10 per 1M tokens
>
> Expect $1-10/month for light usage, $10-50/month for moderate usage.

### Alternative: Use a Different Embedding Provider

If you don't want to use OpenAI, you would need to modify the code to use an alternative embedding provider such as:

- Voyage AI
- Cohere
- Together AI
- Or run local embeddings with Ollama

This requires code changes and is beyond the scope of this deployment guide.

## Part 5: Deploy Your Project

Now that Upstash is configured, let's redeploy with the proper environment variables.

### Step 1: Trigger Redeployment

1. Go to your Vercel project dashboard
2. Click **"Deployments"** tab
3. Find the most recent deployment
4. Click the **"..."** menu → **"Redeploy"**
5. Click **"Redeploy"** to confirm

Alternatively, you can push any change to your GitHub repository and Vercel will auto-deploy.

### Step 2: Wait for Deployment

The deployment will take 2-5 minutes. You can watch the build logs in real-time:

- Click on the deployment to see progress
- Check **"Build Logs"** for any errors
- Monitor **"Functions"** for runtime logs

### Step 3: Verify Deployment Success

1. Once complete, you'll see a green checkmark ✅
2. Click **"Visit"** to open your live application
3. You should see the Docs Hound dashboard load successfully

> **If deployment still fails**: Check Part 9 (Troubleshooting) for common issues.

### What to Test Based on Your Setup

Now that OpenAI is configured, you can test all functionality:

1. **Add a test site**:
   - Click **"Add Site"**
   - Enter a documentation URL (e.g., `https://nextjs.org/docs`)
   - Click **"Add Site"**

2. **Start discovery**:
   - Click **"Start Discovery"** on the site card
   - Wait for discovery to complete (status changes to "discovered")

3. **Index the site**:
   - Review the discovered URLs
   - Click **"Start Indexing"**
   - Wait for indexing to complete (status changes to "indexed")
   - This creates embeddings for all documentation pages using OpenAI

4. **Test chat**:
   - Navigate to **"Chat with Docs"**
   - Select your indexed site
   - Ask a question about the documentation
   - The system will create an embedding from your query and search the vector database

If all steps complete successfully, your deployment is working correctly! 🎉

## Part 7: Set Up the MCP Server

The MCP (Model Context Protocol) server allows AI coding assistants like Cursor to search your indexed documentation. **Note**: This still requires OpenAI because each search query needs to be converted to an embedding before searching the vector database.

### Step 1: Configure MCP in Cursor

1. Open Cursor settings
2. Navigate to **"Features"** → **"Model Context Protocol"**
3. Click **"Edit Config"** (or manually edit `.cursor/mcp.json`)

### Step 2: Add Docs Hound MCP Server

Add this configuration:

```json
{
  "mcpServers": {
    "docs-hound": {
      "command": "npx",
      "args": ["tsx", "mcp-server/src/index.ts"],
      "cwd": "/absolute/path/to/your/docs-hound/fork",
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key",
        "KV_REST_API_URL": "your-redis-url-from-vercel",
        "KV_REST_API_TOKEN": "your-redis-token-from-vercel",
        "UPSTASH_VECTOR_REST_URL": "your-vector-url-from-vercel",
        "UPSTASH_VECTOR_REST_TOKEN": "your-vector-token-from-vercel"
      }
    }
  }
}
```

### Step 3: Get Your Credentials from Vercel

1. Go to your Vercel project
2. Click **"Settings"** → **"Environment Variables"**
3. Copy the values for these environment variables:
   - `OPENAI_API_KEY`
   - `KV_REST_API_URL` (Redis URL)
   - `KV_REST_API_TOKEN` (Redis token)
   - `UPSTASH_VECTOR_REST_URL` (Vector URL)
   - `UPSTASH_VECTOR_REST_TOKEN` (Vector token)
4. Paste them into your MCP config above

> **Important**: The MCP server needs the OpenAI key to convert search queries into embeddings before querying the vector database.

### Step 4: Test the MCP Server

1. Restart Cursor (or reload the MCP servers)
2. In Cursor, try asking:
   > "Search the documentation for authentication setup"
3. Cursor will use the `search_docs` tool to query your indexed documentation

### Available MCP Tools

| Tool              | Description                          | Parameters                                               |
| ----------------- | ------------------------------------ | -------------------------------------------------------- |
| `search_docs`     | Semantic search across documentation | `query` (string), `source` (optional), `topK` (optional) |
| `list_sources`    | List all indexed documentation sites | None                                                     |
| `get_source_info` | Get details about a specific source  | `domain` (string)                                        |

## Part 8: Post-Deployment Configuration

### Domain Configuration (Optional)

To use a custom domain:

1. In Vercel Dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow Vercel's instructions to update DNS records

### Environment Variable Management

To view or update environment variables:

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. View all configured variables (integrated ones show an Upstash icon)
4. To update:
   - Click the **"..."** menu → **"Edit"**
   - Update the value
   - **Important**: Redeploy for changes to take effect

> **Note**: Variables added by Upstash integrations are managed through Upstash Console. Changes there sync automatically.

### Updating OpenAI Key

If you need to update your OpenAI API key:

1. In Vercel: **Settings** → **"Environment Variables"**
2. Find `OPENAI_API_KEY`
3. Click **"..."** → **"Edit"** → Update the value
4. Select all environments (Production, Preview, Development)
5. Redeploy your project
6. Update the key in your local MCP config as well (`.cursor/mcp.json`)

### Monitoring and Logs

To view logs and monitor your deployment:

1. Go to your Vercel project dashboard
2. Click **"Deployments"** → select a deployment
3. View **"Functions"** tab for serverless function logs
4. Check **"Build Logs"** if deployment fails

### Managing Upstash Resources

Access your Upstash databases directly:

1. Go to [Upstash Console](https://console.upstash.com)
2. View Redis database to see site metadata
3. View Vector database to see indexed documents
4. Monitor usage, query performance, and costs

## Part 9: Troubleshooting

### Deployment Fails with "Missing Environment Variables"

**Issue**: Build fails because environment variables are not set.

**Solution**:

1. Verify Upstash integrations are properly configured:
   - Go to **"Settings"** → **"Integrations"**
   - Check that both Upstash Redis and Upstash Vector are listed
2. If missing, add the integrations (see Part 3)
3. If OpenAI error and you want MCP only, ignore it - deploy will succeed without OpenAI
4. Trigger a new deployment

### Upstash Integration Not Working

**Issue**: Integration added but environment variables not appearing.

**Solution**:

1. Go to [Upstash Console](https://console.upstash.com)
2. Verify databases were created successfully
3. In Vercel, remove and re-add the integration
4. Make sure you selected the correct project during integration setup

### "Internal Server Error" on First Load

**Issue**: Application loads but shows 500 error.

**Solution**:

1. Check Vercel function logs (click on deployment → Functions tab)
2. If OpenAI error and you don't need web UI, this is expected
3. If Upstash error:
   - Verify credentials in **"Settings"** → **"Environment Variables"**
   - Test connectivity in Upstash Console
4. Check that Redis database is accessible

### Discovery/Indexing Doesn't Start

**Issue**: Clicking "Start Discovery" or "Start Indexing" shows error.

**Solution**:

1. **Check OpenAI**: These features require `OPENAI_API_KEY`
   - Verify it's set in **"Settings"** → **"Environment Variables"**
   - Ensure the key is valid and has available credits
   - Check your [OpenAI usage dashboard](https://platform.openai.com/usage)
2. Check Vercel function logs for detailed errors
3. Verify Redis database is accessible
4. Try the operation again (may be transient)

### Build Fails with "Cannot find module"

**Issue**: Build fails with module resolution errors.

**Solution**:

1. **Most common issue**: Root directory not set to `apps/web`
   - Go to **"Settings"** → **"General"** → **"Root Directory"**
   - Change to `apps/web`
   - Redeploy
2. Check build logs for the specific missing module
3. Verify all workspace dependencies are listed in `apps/web/package.json`

### Function Timeout Errors

**Issue**: Long-running operations (discovery/indexing) time out.

**Solution**:

1. Vercel Free tier has **10-second** function timeout
2. For large documentation sites:
   - Upgrade to Vercel Pro ($20/month) for **60-second** timeout
   - Or add QStash integration for background processing
   - Or index in smaller batches

### MCP Server Not Connecting

**Issue**: Cursor can't connect to MCP server.

**Solution**:

1. Verify you've cloned your fork locally (MCP runs locally, not on Vercel)
2. Check the `cwd` path in MCP config is correct (absolute path)
3. Ensure environment variables are set in MCP config
4. Run `pnpm install` in your local clone
5. Check Cursor's MCP logs for detailed errors
6. Try restarting Cursor

### MCP Server Shows "No Sources Found"

**Issue**: MCP server connects but `list_sources` returns empty.

**Solution**:

1. No documentation has been indexed yet
2. Use the web UI to index documentation first (requires OpenAI)
3. Once indexed, MCP server will find sources automatically

### MCP Server Search Errors

**Issue**: MCP server search fails with embedding errors.

**Solution**:

1. Verify `OPENAI_API_KEY` is set in your MCP config (`.cursor/mcp.json`)
2. Ensure the OpenAI key is valid and has credits
3. Check Cursor's MCP logs for detailed error messages
4. The MCP server needs OpenAI to convert search queries to embeddings

## Part 10: Advanced Configuration

### Setting Up Analytics

Add Vercel Analytics:

1. In Vercel project, click **"Analytics"**
2. Enable **"Web Analytics"**
3. No code changes required - Vercel injects automatically

### Setting Up Speed Insights

Add Vercel Speed Insights:

1. In Vercel project, click **"Speed Insights"**
2. Enable it for your project
3. Monitor Core Web Vitals and performance metrics

### Configuring Function Regions

To optimize latency:

1. In `apps/web/next.config.js`, add:
   ```javascript
   export const config = {
     regions: ['iad1'], // US East (same as your Upstash region)
   }
   ```
2. Choose the region closest to your Upstash databases

### Setting Up Preview Deployments

Vercel automatically creates preview deployments for pull requests:

1. Every PR gets a unique preview URL
2. Preview deployments use "Preview" environment variables
3. Test changes before merging to production

### Optional Security Variables

Add these environment variables for enhanced security:

```bash
# Generate random secrets
openssl rand -base64 32
```

| Variable      | Purpose                     | Required |
| ------------- | --------------------------- | -------- |
| `CRON_SECRET` | Secure cron job endpoints   | No       |
| `MCP_API_KEY` | Secure MCP API (future use) | No       |

Add in Vercel **"Settings"** → **"Environment Variables"**.

## Part 11: Security Best Practices

### 1. Rotate Secrets Regularly

- Update security tokens every 90 days
- Regenerate Upstash tokens if compromised (via Upstash Console)
- Keep OpenAI API key secure (if using)

### 2. Enable Environment Protection

In Vercel:

1. Use separate Upstash databases for Production vs. Preview (optional)
2. Never commit secrets to Git
3. Review environment variables in **"Settings"** regularly

### 3. Monitor Usage

- Set up billing alerts in [Upstash Console](https://console.upstash.com)
- Monitor OpenAI API usage and costs (if using)
- Review Vercel function invocation metrics

### 4. Restrict Access (Optional)

For private deployments:

1. In Vercel, go to **"Settings"** → **"Deployment Protection"**
2. Enable **"Vercel Authentication"** (requires login)
3. Or implement custom authentication in the app

## Part 12: Cost Estimation

### Free Tier Limits

| Service            | Free Tier                              | Good For      |
| ------------------ | -------------------------------------- | ------------- |
| **Vercel**         | 100 GB bandwidth, 100 GB-hours compute | MVP & testing |
| **Upstash Redis**  | 10k commands/day                       | MVP & testing |
| **Upstash Vector** | 10k queries/day, 10k updates/day       | MVP & testing |
| **OpenAI**         | Pay-as-you-go (no free tier)           | Usage-based   |

### Expected Costs

**Important**: OpenAI is required for all functionality (indexing and searching).

#### Light Usage (Personal/Testing)

- **Vercel**: $0 (free tier sufficient)
- **Upstash Redis**: $0 (free tier sufficient for metadata)
- **Upstash Vector**: $0 (free tier sufficient for moderate doc storage)
- **OpenAI**: $1-10/month
  - Embeddings: ~$0.02 per 1M tokens (very cheap)
  - Chat: ~$2.50-$10 per 1M tokens
  - Indexing 100-1000 pages: ~$0.50-$5
  - Regular searching/chatting: ~$1-5/month

**Total**: $1-10/month for personal use 💰

#### Production Usage (Team/Company)

For production deployment with multiple users and large documentation sites:

- **Vercel**: $0-20/month (free tier or Pro for longer function timeouts)
- **Upstash Redis**: $0-10/month (scales with usage)
- **Upstash Vector**: $0-30/month (scales with document count)
- **OpenAI**: $10-100/month (depends heavily on usage)
  - More documentation sites = more embeddings
  - More users = more chat queries
  - Bulk indexing can cost more upfront

**Total**: $10-160/month for production use

> **Tip**: Start with free tiers and monitor costs closely. OpenAI embeddings are very cheap; chat is the main cost driver. You can monitor usage in each service's dashboard.

## Part 13: Support and Resources

### Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Upstash Documentation](https://docs.upstash.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI Documentation](https://platform.openai.com/docs) (if using)

### Community

- [Vercel Discord](https://vercel.com/discord)
- [Upstash Discord](https://upstash.com/discord)

### Need Help?

1. Check Vercel function logs first
2. Review Upstash database metrics
3. Look for errors in browser console
4. Check this guide's troubleshooting section

---

## Quick Reference: Deployment Checklist

Use this checklist to ensure you've completed all steps:

### Required for All Deployments

- [ ] Forked repository to your GitHub account
- [ ] Created Vercel account (via GitHub login)
- [ ] Imported project to Vercel
- [ ] Set root directory to `apps/web`
- [ ] Did initial deployment (may fail - that's okay)
- [ ] Added Upstash Redis integration
- [ ] Added Upstash Vector integration (1536 dimensions, Cosine)
- [ ] Created OpenAI account and API key
- [ ] Added `OPENAI_API_KEY` to Vercel
- [ ] Redeployed successfully
- [ ] Verified deployment by visiting URL

### For Web UI Testing

- [ ] Tested adding a documentation site
- [ ] Tested discovery process
- [ ] Tested indexing process (creates embeddings)
- [ ] Tested chat functionality

### For MCP Server Setup

- [ ] Cloned your fork locally
- [ ] Got all credentials from Vercel env vars (including OpenAI)
- [ ] Configured MCP in Cursor with all credentials
- [ ] Tested `list_sources` tool
- [ ] Tested `search_docs` tool (uses OpenAI for query embeddings)
- [ ] Confirmed MCP server connects and searches successfully

### Optional Enhancements

- [ ] Added QStash integration for background jobs
- [ ] Configured custom domain
- [ ] Enabled Vercel Analytics
- [ ] Enabled Speed Insights
- [ ] Added security variables (`CRON_SECRET`, `MCP_API_KEY`)
- [ ] Set up billing alerts in Upstash
- [ ] Configured deployment protection

---

## Summary

You've successfully deployed Docs Hound! Here's what you have:

### What You Can Do Now

**With full deployment (Vercel + Upstash + OpenAI):**

- ✅ Index documentation sites via web UI (OpenAI creates embeddings)
- ✅ Chat with indexed documentation (OpenAI powers search and responses)
- ✅ Use MCP server with Cursor (OpenAI converts queries to embeddings)
- ✅ Full semantic search capabilities across all documentation

### How It Works

1. **Indexing**: Documentation → OpenAI (creates embeddings) → Upstash Vector (stores embeddings)
2. **Searching**: Query → OpenAI (creates embedding) → Upstash Vector (finds similar embeddings) → Results
3. **Chat**: Query → Search (above) → OpenAI (generates response from results) → Streamed response

**Key Insight**: Upstash Vector is a database that stores and searches embeddings, but OpenAI (or another embedding model) is required to create those embeddings from text.

### Next Steps

1. **Index some documentation**:
   - Start with a small site to test (e.g., a single-page doc)
   - Monitor OpenAI usage during indexing
   - Then add larger documentation sites

2. **Set up your MCP server** in Cursor:
   - Get all credentials from Vercel (including OpenAI key)
   - Configure `.cursor/mcp.json`
   - Test with search queries

3. **Monitor your usage and costs**:
   - Check Vercel deployment metrics
   - Monitor Upstash database usage
   - **Track OpenAI costs** (most important for budget)
   - Set up billing alerts in OpenAI dashboard

4. **Customize and extend**:
   - Fork allows you to modify the code
   - Consider alternative embedding providers to reduce costs
   - Add custom features or integrations
   - Deploy changes via Git push (auto-deploys!)

### Cost Management Tips

- **Embeddings are cheap**: ~$0.02 per 1M tokens
- **Chat is expensive**: ~$2.50-$10 per 1M tokens
- **Optimize for cost**:
  - Index documentation once, search many times
  - Use caching where possible
  - Monitor OpenAI usage regularly
  - Consider switching to cheaper embedding models if needed

Happy documenting! 🚀📚
