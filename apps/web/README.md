# Web Application

This is the Next.js web application for Docs Hound.

## Environment Variables

**Important**: Create a `.env.local` file **in this directory** (`apps/web/.env.local`) with your environment variables.

### Option 1: Pull from Vercel (Recommended)

If you have a Vercel project deployed:

```bash
# From the project root, run:
pnpm env:pull
```

This automatically downloads all environment variables from Vercel and saves them to `apps/web/.env.local`.

### Option 2: Manual Setup

```bash
# From the project root, run:
cp env.template apps/web/.env.local

# Then edit apps/web/.env.local with your credentials
```

See the main [README.md](../../README.md) for the full list of required environment variables.

## Development

From the **project root**, run:

```bash
pnpm dev
```

The app will start at `http://localhost:3000`.

## Why apps/web/.env.local?

This is a **monorepo** (multiple packages in one repository). Next.js looks for `.env.local` in the same directory as the app, not in the project root. That's why the file must be in `apps/web/.env.local`.
