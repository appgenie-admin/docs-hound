'use client'

import {
  Button,
  Checkbox,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconSearch, IconUpload } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

interface DiscoveredUrlsListProps {
  domain: string
  urls: string[]
}

export function DiscoveredUrlsList({ domain, urls }: DiscoveredUrlsListProps) {
  const router = useRouter()
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set(urls))
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredUrls = useMemo(() => {
    // Sort URLs alphabetically (LATCH: Alphabet)
    const sortedUrls = [...urls].sort((a, b) => a.localeCompare(b))
    if (!search) return sortedUrls
    const searchLower = search.toLowerCase()
    return sortedUrls.filter((url) => url.toLowerCase().includes(searchLower))
  }, [urls, search])

  const allSelected = selectedUrls.size === urls.length
  const someSelected = selectedUrls.size > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelectedUrls(new Set())
    } else {
      setSelectedUrls(new Set(urls))
    }
  }

  const toggleUrl = (url: string) => {
    const newSet = new Set(selectedUrls)
    if (newSet.has(url)) {
      newSet.delete(url)
    } else {
      newSet.add(url)
    }
    setSelectedUrls(newSet)
  }

  const handleIndex = async () => {
    if (selectedUrls.size === 0) {
      alert('Please select at least one URL to index')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          urls: Array.from(selectedUrls),
        }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        const error = await response.text()
        alert(`Failed to start indexing: ${error}`)
      }
    } catch (error) {
      console.error('Failed to start indexing:', error)
      alert('Failed to start indexing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <TextInput
          placeholder="Filter URLs..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 400 }}
        />
        <Group gap="xs">
          <Checkbox
            label={`Select all (${selectedUrls.size}/${urls.length})`}
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleAll}
          />
          <Button
            leftSection={<IconUpload size={16} />}
            loading={loading}
            disabled={selectedUrls.size === 0}
            onClick={handleIndex}
          >
            Index Selected ({selectedUrls.size})
          </Button>
        </Group>
      </Group>

      <ScrollArea style={{ height: 'calc(100vh - 420px)' }}>
        <Stack gap={4}>
          {filteredUrls.map((url) => (
            <Paper
              key={url}
              p="xs"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => toggleUrl(url)}
            >
              <Group gap="sm">
                <Checkbox
                  checked={selectedUrls.has(url)}
                  onChange={() => toggleUrl(url)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Text size="sm" style={{ wordBreak: 'break-all' }}>
                  {url}
                </Text>
              </Group>
            </Paper>
          ))}
          {filteredUrls.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              No URLs match your search
            </Text>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  )
}
