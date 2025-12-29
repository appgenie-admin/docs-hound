import { NextRequest, NextResponse } from 'next/server'
import { getSiteRegistry } from '@docs-hound/shared-db'

export async function GET() {
  try {
    const registry = getSiteRegistry()
    const sites = await registry.listSites()
    return NextResponse.json(sites)
  } catch (error) {
    console.error('Failed to list sites:', error)
    return NextResponse.json({ error: 'Failed to list sites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, name, description } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const registry = getSiteRegistry()

    // Extract domain and check if already exists
    const domain = new URL(url).hostname
    const exists = await registry.siteExists(domain)
    if (exists) {
      return NextResponse.json(
        { error: 'Site already exists' },
        { status: 409 }
      )
    }

    const site = await registry.addSite(url, name, description)
    return NextResponse.json(site, { status: 201 })
  } catch (error) {
    console.error('Failed to add site:', error)
    return NextResponse.json({ error: 'Failed to add site' }, { status: 500 })
  }
}
