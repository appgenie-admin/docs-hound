'use client'

import {
  Drawer,
  Stack,
  Group,
  Button,
  Text,
  ScrollArea,
  Loader,
  Alert,
  Code,
  Paper,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconEye,
  IconCode,
  IconCopy,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MarkdownDrawerProps {
  opened: boolean
  onClose: () => void
  url: string | null
}

interface DocumentData {
  url: string
  title: string
  content: string
  source: string
  scrapedAt: string
}

export function MarkdownDrawer({ opened, onClose, url }: MarkdownDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (opened && url) {
      fetchMarkdown(url)
    } else {
      // Reset state when drawer closes
      setDocument(null)
      setError(null)
      setViewMode('preview')
      setCopied(false)
    }
  }, [opened, url])

  const fetchMarkdown = async (pageUrl: string) => {
    setLoading(true)
    setError(null)
    setDocument(null)

    try {
      console.log('[MarkdownDrawer] Fetching markdown for:', pageUrl)
      const response = await fetch(
        `/api/pages/markdown?url=${encodeURIComponent(pageUrl)}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch markdown')
      }

      const data = await response.json()
      console.log('[MarkdownDrawer] ✓ Loaded markdown:', data.title)
      setDocument(data)
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('[MarkdownDrawer] ✗ Error:', error.message)
      setError(error.message || 'Failed to load markdown')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!document?.content) return

    try {
      if (typeof window !== 'undefined' && window.navigator?.clipboard) {
        await window.navigator.clipboard.writeText(document.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('[MarkdownDrawer] ✗ Failed to copy:', err)
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="xl"
      title={
        <Group gap="xs">
          <Text fw={600} size="lg">
            Page Content
          </Text>
          {document && (
            <Text size="sm" c="dimmed">
              ({viewMode === 'preview' ? 'Preview' : 'Markdown'})
            </Text>
          )}
        </Group>
      }
      styles={{
        body: {
          height: 'calc(100% - 60px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Stack gap="md" style={{ height: '100%', overflow: 'hidden' }}>
        {/* Controls */}
        {document && (
          <Group justify="space-between">
            <Group gap="xs">
              <Button
                size="sm"
                variant={viewMode === 'preview' ? 'filled' : 'light'}
                leftSection={<IconEye size={16} />}
                onClick={() => setViewMode('preview')}
              >
                Preview
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'raw' ? 'filled' : 'light'}
                leftSection={<IconCode size={16} />}
                onClick={() => setViewMode('raw')}
              >
                Markdown
              </Button>
            </Group>

            <Tooltip label={copied ? 'Copied!' : 'Copy markdown'}>
              <ActionIcon
                size="lg"
                variant="light"
                onClick={handleCopy}
                color={copied ? 'green' : 'blue'}
              >
                {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        )}

        {/* Document Info */}
        {document && (
          <Paper withBorder p="sm">
            <Stack gap={4}>
              <Text fw={600} size="sm">
                {document.title}
              </Text>
              <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                {document.url}
              </Text>
            </Stack>
          </Paper>
        )}

        {/* Loading State */}
        {loading && (
          <Stack align="center" justify="center" style={{ flex: 1 }}>
            <Loader size="lg" />
            <Text c="dimmed">Loading markdown content...</Text>
          </Stack>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Content */}
        {document && !loading && !error && (
          <ScrollArea style={{ flex: 1 }} offsetScrollbars>
            {viewMode === 'preview' ? (
              <Paper p="md" style={{ minHeight: '100%' }}>
                <div className="markdown-preview">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {document.content}
                  </ReactMarkdown>
                </div>
              </Paper>
            ) : (
              <Code
                block
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {document.content}
              </Code>
            )}
          </ScrollArea>
        )}
      </Stack>
    </Drawer>
  )
}
