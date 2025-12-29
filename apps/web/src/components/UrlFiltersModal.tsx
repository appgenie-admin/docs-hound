'use client'

import { useState } from 'react'
import { Modal, Button, Group } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { UrlFiltersForm, type UrlFilters } from './UrlFiltersForm'

interface UrlFiltersModalProps {
  domain: string
  currentFilters?: UrlFilters
}

export function UrlFiltersModal({
  domain,
  currentFilters,
}: UrlFiltersModalProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [filters, setFilters] = useState<UrlFilters>(
    currentFilters || { includePatterns: [], excludePatterns: [] }
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/sites/${encodeURIComponent(domain)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlFilters: filters }),
      })

      if (!response.ok) {
        throw new Error('Failed to update filters')
      }

      // Refresh the page to show updated filters
      window.location.reload()
    } catch (error) {
      console.error('Failed to save filters:', error)
      alert('Failed to save URL filters. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        leftSection={<IconSettings size={16} />}
        onClick={open}
      >
        URL Filters
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title="Configure URL Filters"
        size="xl"
      >
        <UrlFiltersForm initialFilters={currentFilters} onChange={setFilters} />

        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Filters
          </Button>
        </Group>
      </Modal>
    </>
  )
}
