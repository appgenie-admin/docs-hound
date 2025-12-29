import { NextRequest, NextResponse } from 'next/server'

const AUTH_COOKIE_NAME = 'docs-hound-auth'
const AUTH_TOKEN_VALUE = 'authenticated'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Check if UI_PASSWORD is configured
    const uiPassword = process.env.UI_PASSWORD
    if (!uiPassword) {
      return NextResponse.json(
        { error: 'Password protection not configured' },
        { status: 500 }
      )
    }

    // Verify password
    if (password !== uiPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Create response with authentication cookie
    const response = NextResponse.json({ success: true })

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: AUTH_TOKEN_VALUE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Auth API] Error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Logout - clear the cookie
  const response = NextResponse.json({ success: true })

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
