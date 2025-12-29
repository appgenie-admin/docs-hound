import { NextRequest, NextResponse } from 'next/server'
import { getSiteRegistry } from '@docs-hound/shared-db'
import { getDocStorage } from '@docs-hound/doc-scraper'

interface RouteContext {
  params: Promise<{ domain: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { domain } = await context.params
    const decodedDomain = decodeURIComponent(domain)

    const registry = getSiteRegistry()
    const site = await registry.getSite(decodedDomain)

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    return NextResponse.json({ domain: decodedDomain, ...site })
  } catch (error) {
    console.error('Failed to get site:', error)
    return NextResponse.json({ error: 'Failed to get site' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { domain } = await context.params
    const decodedDomain = decodeURIComponent(domain)

    const registry = getSiteRegistry()

    // Check if site exists
    const exists = await registry.siteExists(decodedDomain)
    if (!exists) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Delete from vector storage
    try {
      const storage = getDocStorage()
      await storage.deleteBySource(decodedDomain)
    } catch (error) {
      console.warn('Failed to delete from vector storage:', error)
      // Continue with site removal even if vector deletion fails
    }

    // Remove from registry
    await registry.removeSite(decodedDomain)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete site:', error)
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    )
  }
}
