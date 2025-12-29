'use client'

import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Anchor,
  Select,
} from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { ChatInterface } from '@/components/ChatInterface'

interface Site {
  domain: string
  name: string
  status: string
}

function ChatPageContent() {
  const searchParams = useSearchParams()
  const sourceParam = searchParams.get('source')
  const [source, setSource] = useState<string | null>(sourceParam)
  const [sites, setSites] = useState<Site[]>([])

  useEffect(() => {
    // Fetch indexed sites
    fetch('/api/sites')
      .then((res) => res.json())
      .then((data: Site[]) => {
        const indexed = data.filter((s) => s.status === 'indexed')
        setSites(indexed)
      })
      .catch(console.error)
  }, [])

  return (
    <Container size="lg" py="xl">
      <Anchor component={Link} href="/" c="dimmed" size="sm" mb="md">
        <Group gap={4}>
          <IconArrowLeft size={14} />
          Back to Dashboard
        </Group>
      </Anchor>

      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Chat with Documentation</Title>
          <Text c="dimmed" mt="xs">
            Ask questions about your indexed documentation
          </Text>
        </div>
        <Select
          placeholder="All sources"
          data={[
            { value: '', label: 'All sources' },
            ...sites.map((s) => ({ value: s.domain, label: s.name })),
          ]}
          value={source || ''}
          onChange={(value) => setSource(value || null)}
          clearable
          style={{ minWidth: 200 }}
        />
      </Group>

      <Paper
        withBorder
        p="md"
        radius="md"
        style={{ height: 'calc(100vh - 250px)' }}
      >
        <ChatInterface source={source} />
      </Paper>
    </Container>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <Container size="lg" py="xl">
          <Text>Loading...</Text>
        </Container>
      }
    >
      <ChatPageContent />
    </Suspense>
  )
}
