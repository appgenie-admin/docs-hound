'use client'

import {
  Container,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Stack,
  Paper,
  Group,
  Anchor,
} from '@mantine/core'
import { IconArrowLeft, IconWorld } from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AddSitePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate URL
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, description }),
      })

      if (response.ok) {
        const site = await response.json()
        // Start discovery automatically
        await fetch('/api/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: site.domain }),
        })
        router.push(`/sites/${encodeURIComponent(site.domain)}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add site')
      }
    } catch (err) {
      console.error('Failed to add site:', err)
      setError('Failed to add site')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Anchor component={Link} href="/" c="dimmed" size="sm" mb="md">
        <Group gap={4}>
          <IconArrowLeft size={14} />
          Back to Dashboard
        </Group>
      </Anchor>

      <Title order={1} mb="xs">
        Add Documentation Site
      </Title>
      <Text c="dimmed" mb="xl">
        Enter the URL of a documentation site to index. We&apos;ll crawl it and
        make it searchable.
      </Text>

      <Paper withBorder p="xl" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Documentation URL"
              description="The main URL of the documentation site"
              placeholder="https://docs.example.com"
              leftSection={<IconWorld size={16} />}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              error={error}
            />

            <TextInput
              label="Name"
              description="A friendly name for this documentation"
              placeholder="Example Docs"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Textarea
              label="Description"
              description="Brief description of what this documentation covers"
              placeholder="Official documentation for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <Group justify="flex-end" mt="md">
              <Button component={Link} href="/" variant="subtle">
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Add & Start Discovery
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
