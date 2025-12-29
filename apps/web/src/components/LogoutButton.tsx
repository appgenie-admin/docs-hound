'use client'

import { Button } from '@mantine/core'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
      })

      // Redirect to login page
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('[Logout] Error:', error)
    }
  }

  return (
    <Button variant="subtle" size="sm" onClick={handleLogout}>
      Logout
    </Button>
  )
}
