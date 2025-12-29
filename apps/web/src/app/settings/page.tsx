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

const mcpConfig = {
  mcpServers: {
    'docs-hound': {
      command: 'npx',
      args: ['tsx', 'mcp-server/src/index.ts'],
      env: {
        OPENAI_API_KEY: '<your-openai-api-key>',
        KV_REST_API_URL: '<your-redis-url-from-vercel>',
        KV_REST_API_TOKEN: '<your-redis-token-from-vercel>',
        UPSTASH_VECTOR_REST_URL: '<your-vector-url-from-vercel>',
        UPSTASH_VECTOR_REST_TOKEN: '<your-vector-token-from-vercel>',
      },
    },
  },
}

export default function SettingsPage() {
  const configJson = JSON.stringify(mcpConfig, null, 2)

  return (
    <Container size="md" py="xl">
      <Anchor
        href="/"
        c="dimmed"
        size="sm"
        mb="md"
        style={{ textDecoration: 'none' }}
      >
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
            credentials from Vercel Environment Variables settings.
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
