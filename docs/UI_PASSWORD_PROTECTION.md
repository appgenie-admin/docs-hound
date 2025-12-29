# UI Password Protection

Simple password protection for the Docs Hound web interface.

## Overview

This is a lightweight, cookie-based authentication system that protects the web UI with a single shared password. It's designed for personal use to prevent casual access to your deployed instance.

**⚠️ Important:** This is "faux security" - it's not OAuth, not multi-user authentication, and not designed for production security requirements. It's a simple password gate suitable for personal projects.

## Features

- ✅ Simple password protection for all UI pages
- ✅ Cookie-based session (30-day persistence)
- ✅ Automatic redirect to login page when not authenticated
- ✅ Return to original page after login
- ✅ Logout functionality
- ✅ MCP API endpoint (`/api/mcp`) is not affected
- ✅ Optional - works when `UI_PASSWORD` is set, disabled otherwise

## Setup

### 1. Set the Password

**Local Development:**

Add to `apps/web/.env.local`:

```env
UI_PASSWORD=your-secure-password
```

**Vercel Deployment:**

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name**: `UI_PASSWORD`
   - **Value**: Your password (recommend using a password manager)
   - **Environment**: Production (and Preview/Development if needed)
4. Redeploy your application

### 2. Access the Application

When `UI_PASSWORD` is set:

1. Navigate to your Docs Hound URL
2. You'll be redirected to `/login`
3. Enter the password
4. You'll be redirected back to the page you were trying to access
5. Authentication persists for 30 days

### 3. Logout

A logout button appears in the header when password protection is enabled. Click it to clear your session and return to the login page.

## How It Works

### Middleware (`src/middleware.ts`)

- Runs on every request
- Checks if `UI_PASSWORD` is configured
  - If not configured → Allow all access
  - If configured → Check for authentication cookie
- Redirects unauthenticated users to `/login`
- Exempts:
  - `/login` page
  - `/api/auth` endpoint (login/logout)
  - `/api/mcp` endpoint (has its own auth)

### Authentication API (`src/app/api/auth/route.ts`)

**POST** - Login

- Accepts: `{ password: string }`
- Validates against `UI_PASSWORD` env var
- Returns: HTTP-only cookie with 30-day expiration
- Secure in production (HTTPS only)

**DELETE** - Logout

- Clears the authentication cookie

### Login Page (`src/app/login/page.tsx`)

- Simple password input form
- Shows error messages on failed attempts
- Preserves the original destination URL
- Redirects to intended page after successful login

### Cookie Details

- **Name**: `docs-hound-auth`
- **Value**: `authenticated` (static token)
- **HttpOnly**: `true` (not accessible via JavaScript)
- **Secure**: `true` in production (HTTPS only)
- **SameSite**: `lax`
- **Max Age**: 30 days
- **Path**: `/` (application-wide)

## Security Considerations

### What This Provides

- ✅ Prevents casual/accidental access
- ✅ Good for personal projects
- ✅ Good for internal tools
- ✅ Simple to set up and maintain

### What This Does NOT Provide

- ❌ Multi-user authentication
- ❌ User accounts or roles
- ❌ Rate limiting
- ❌ Brute force protection
- ❌ Password hashing (compared in plain text)
- ❌ Session management
- ❌ Audit logging
- ❌ Password reset functionality
- ❌ Protection against determined attackers

### Recommendations

1. **Use a strong password** - Long, random, unique
2. **Don't share the password** - This is single-user authentication
3. **Use HTTPS** - Always deploy to Vercel (automatic HTTPS)
4. **Rotate periodically** - Change the password occasionally
5. **Consider alternatives** - For production apps, use:
   - NextAuth.js
   - Clerk
   - Auth0
   - Supabase Auth

## Disabling Authentication

To disable password protection:

1. Remove the `UI_PASSWORD` environment variable
2. Redeploy (for Vercel)
3. Restart the dev server (for local)

The application will work normally without any authentication.

## Troubleshooting

### "Password protection not configured" Error

- The `UI_PASSWORD` environment variable is set in Cursor/local but not in the deployed environment
- Add it to Vercel environment variables and redeploy

### Can't Access After Entering Correct Password

- Check browser console for errors
- Try clearing cookies for the site
- Verify you're using HTTPS in production
- Check the Next.js server logs

### Logout Button Not Showing

- The `UI_PASSWORD` is not set
- The component checks for the env var at build time
- Clear Next.js cache and rebuild: `pnpm build`

### Cookie Not Persisting

- Browser may be blocking cookies
- Check browser privacy settings
- In production, ensure HTTPS is working
- Check that the cookie domain matches your site

## Implementation Files

- `/apps/web/src/middleware.ts` - Request interception
- `/apps/web/src/app/api/auth/route.ts` - Login/logout API
- `/apps/web/src/app/login/page.tsx` - Login form
- `/apps/web/src/components/LogoutButton.tsx` - Logout button component
- `/apps/web/src/app/page.tsx` - Updated to show logout button
