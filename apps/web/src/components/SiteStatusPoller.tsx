'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SiteStatusPoller() {
  const router = useRouter()

  useEffect(() => {
    // Poll every 3 seconds for status updates
    const interval = setInterval(() => {
      router.refresh()
    }, 3000)

    return () => clearInterval(interval)
  }, [router])

  return null
}
