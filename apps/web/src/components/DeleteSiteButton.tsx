'use client'

import { Button } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteSiteButtonProps {
  domain: string
}

export function DeleteSiteButton({ domain }: DeleteSiteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${domain}?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/sites/${encodeURIComponent(domain)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const error = await response.text()
        alert(`Failed to delete site: ${error}`)
      }
    } catch (error) {
      console.error('Failed to delete site:', error)
      alert('Failed to delete site')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="xs"
      variant="subtle"
      color="red"
      leftSection={<IconTrash size={14} />}
      loading={loading}
      onClick={handleDelete}
    >
      Delete
    </Button>
  )
}
