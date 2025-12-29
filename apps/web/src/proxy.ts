import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = 'docs-hound-auth'
const AUTH_TOKEN_VALUE = 'authenticated'

/**
 * Simple password protection proxy
 * Checks for authentication cookie before allowing access to protected routes
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page and auth API
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow access to MCP API (has its own authentication)
  if (pathname.startsWith('/api/mcp')) {
    return NextResponse.next()
  }

  // Check if UI_PASSWORD is configured
  const uiPassword = process.env.UI_PASSWORD
  if (!uiPassword) {
    // No password configured, allow access
    return NextResponse.next()
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)

  if (!authCookie || authCookie.value !== AUTH_TOKEN_VALUE) {
    // Not authenticated, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
