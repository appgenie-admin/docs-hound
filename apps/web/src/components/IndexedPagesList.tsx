'use client'

import {
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Anchor,
  Group,
} from '@mantine/core'
import { IconExternalLink, IconSearch } from '@tabler/icons-react'
import { useState, useMemo } from 'react'

interface IndexedPagesListProps {
  urls: string[]
}

export function IndexedPagesList({ urls }: IndexedPagesListProps) {
  const [search, setSearch] = useState('')

  const filteredUrls = useMemo(() => {
    // Sort URLs alphabetically (LATCH: Alphabet)
    const sortedUrls = [...urls].sort((a, b) => a.localeCompare(b))
    if (!search) return sortedUrls
    const searchLower = search.toLowerCase()
    return sortedUrls.filter((url) => url.toLowerCase().includes(searchLower))
  }, [urls, search])

  if (urls.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No pages indexed yet
      </Text>
    )
  }

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Filter pages..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 400 }}
      />

      <Text size="sm" c="dimmed">
        Showing {filteredUrls.length} of {urls.length} pages
      </Text>

      <ScrollArea h={400}>
        <Stack gap={4}>
          {filteredUrls.map((url) => (
            <Paper key={url} p="xs" withBorder>
              <Group justify="space-between">
                <Text size="sm" style={{ wordBreak: 'break-all', flex: 1 }}>
                  {url}
                </Text>
                <Anchor
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  c="dimmed"
                >
                  <IconExternalLink size={16} />
                </Anchor>
              </Group>
            </Paper>
          ))}
          {filteredUrls.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              No pages match your search
            </Text>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  )
}
