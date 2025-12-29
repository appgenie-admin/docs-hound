'use client'

import {
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import { IconExternalLink, IconSearch, IconFileText } from '@tabler/icons-react'
import { useState, useMemo } from 'react'
import { MarkdownDrawer } from './MarkdownDrawer'

interface IndexedPagesListProps {
  urls: string[]
}

export function IndexedPagesList({ urls }: IndexedPagesListProps) {
  const [search, setSearch] = useState('')
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

  const filteredUrls = useMemo(() => {
    // Sort URLs alphabetically (LATCH: Alphabet)
    const sortedUrls = [...urls].sort((a, b) => a.localeCompare(b))
    if (!search) return sortedUrls
    const searchLower = search.toLowerCase()
    return sortedUrls.filter((url) => url.toLowerCase().includes(searchLower))
  }, [urls, search])

  const handleViewMarkdown = (url: string) => {
    setSelectedUrl(url)
    setDrawerOpened(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpened(false)
    // Keep selectedUrl for a moment to allow drawer to animate closed
    setTimeout(() => setSelectedUrl(null), 300)
  }

  if (urls.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No pages indexed yet
      </Text>
    )
  }

  return (
    <>
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
                <Group justify="space-between" gap="xs">
                  <Text size="sm" style={{ wordBreak: 'break-all', flex: 1 }}>
                    {url}
                  </Text>
                  <Group gap={4}>
                    <Tooltip label="View markdown">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleViewMarkdown(url)}
                      >
                        <IconFileText size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Open in new tab">
                      <ActionIcon
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="subtle"
                        color="gray"
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
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

      <MarkdownDrawer
        opened={drawerOpened}
        onClose={handleCloseDrawer}
        url={selectedUrl}
      />
    </>
  )
}
