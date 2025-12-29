'use client'

import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Anchor,
  Stack,
  Code,
  Button,
  CopyButton,
  ActionIcon,
} from '@mantine/core'
import { IconArrowLeft, IconCopy, IconCheck } from '@tabler/icons-react'
import Link from 'next/link'

const mcpConfig = {
  mcpServers: {
    'docs-hound': {
      command: 'npx',
      args: ['tsx', 'mcp-server/src/index.ts'],
      env: {
        UPSTASH_VECTOR_REST_URL: '<your-upstash-vector-url>',
        UPSTASH_VECTOR_REST_TOKEN: '<your-upstash-vector-token>',
        UPSTASH_REDIS_REST_URL: '<your-upstash-redis-url>',
        UPSTASH_REDIS_REST_TOKEN: '<your-upstash-redis-token>',
      },
    },
  },
}

export default function SettingsPage() {
  const configJson = JSON.stringify(mcpConfig, null, 2)

  return (
    <Container size="md" py="xl">
      <Anchor component={Link} href="/" c="dimmed" size="sm" mb="md">
        <Group gap={4}>
          <IconArrowLeft size={14} />
          Back to Dashboard
        </Group>
      </Anchor>

      <Title order={1} mb="xs">
        Settings
      </Title>
      <Text c="dimmed" mb="xl">
        Configure Docs Hound for your environment
      </Text>

      <Stack gap="lg">
        <Paper withBorder p="xl" radius="md">
          <Group justify="space-between" mb="md">
            <div>
              <Title order={3}>MCP Server Configuration</Title>
              <Text c="dimmed" size="sm">
                Add this to your Cursor settings to enable the Docs Hound MCP
                server
              </Text>
            </div>
            <CopyButton value={configJson}>
              {({ copied, copy }) => (
                <Button
                  variant={copied ? 'filled' : 'light'}
                  color={copied ? 'green' : 'blue'}
                  leftSection={
                    copied ? <IconCheck size={16} /> : <IconCopy size={16} />
                  }
                  onClick={copy}
                >
                  {copied ? 'Copied!' : 'Copy Config'}
                </Button>
              )}
            </CopyButton>
          </Group>

          <Paper
            withBorder
            p="md"
            radius="md"
            bg="gray.0"
            style={{ position: 'relative' }}
          >
            <CopyButton value={configJson}>
              {({ copied, copy }) => (
                <ActionIcon
                  variant="subtle"
                  style={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={copy}
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              )}
            </CopyButton>
            <Code block style={{ whiteSpace: 'pre-wrap' }}>
              {configJson}
            </Code>
          </Paper>

          <Text size="sm" c="dimmed" mt="md">
            Replace the environment variable placeholders with your actual
            Upstash credentials.
          </Text>
        </Paper>

        <Paper withBorder p="xl" radius="md">
          <Title order={3} mb="md">
            Available MCP Tools
          </Title>
          <Stack gap="sm">
            <Paper withBorder p="md" radius="sm">
              <Text fw={500}>search_docs</Text>
              <Text size="sm" c="dimmed">
                Search indexed documentation using semantic search. Can filter
                by source domain.
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="sm">
              <Text fw={500}>list_sources</Text>
              <Text size="sm" c="dimmed">
                List all indexed documentation sources with their status and
                page counts.
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="sm">
              <Text fw={500}>get_source_info</Text>
              <Text size="sm" c="dimmed">
                Get detailed information about a specific documentation source.
              </Text>
            </Paper>
          </Stack>
        </Paper>

        <Paper withBorder p="xl" radius="md">
          <Title order={3} mb="md">
            MCP Resources
          </Title>
          <Stack gap="sm">
            <Paper withBorder p="md" radius="sm">
              <Code>docs://sources</Code>
              <Text size="sm" c="dimmed" mt="xs">
                JSON list of all indexed documentation sites
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="sm">
              <Code>docs://sources/&#123;domain&#125;</Code>
              <Text size="sm" c="dimmed" mt="xs">
                Detailed information about a specific source, including indexed
                page URLs
              </Text>
            </Paper>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
