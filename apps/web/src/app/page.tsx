import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Badge,
  Group,
  Button,
  Stack,
  Anchor,
} from '@mantine/core'
import { IconPlus, IconRefresh, IconWorld } from '@tabler/icons-react'
import Link from 'next/link'
import { getSiteRegistry, type Site } from '@docs-hound/shared-db'
import { DeleteSiteButton } from '@/components/DeleteSiteButton'

// Force dynamic rendering since we need runtime env vars
export const dynamic = 'force-dynamic'

async function getSites(): Promise<Site[]> {
  try {
    const registry = getSiteRegistry()
    return await registry.listSites()
  } catch (error) {
    console.error('Failed to fetch sites:', error)
    return []
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'indexed':
      return 'green'
    case 'indexing':
    case 'discovering':
      return 'blue'
    case 'discovered':
      return 'yellow'
    case 'pending':
      return 'gray'
    case 'error':
      return 'red'
    default:
      return 'gray'
  }
}

function formatDate(date: string | null): string {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function Home() {
  const sites = await getSites()

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Docs Hound</Title>
          <Text c="dimmed" mt="xs">
            Documentation search and indexing platform
          </Text>
        </div>
        <Group gap="sm">
          <Link href="/chat" passHref legacyBehavior>
            <Button component="a" variant="light">
              Chat with Docs
            </Button>
          </Link>
          <Link href="/settings" passHref legacyBehavior>
            <Button component="a" variant="subtle">
              Settings
            </Button>
          </Link>
          <Link href="/sites/new" passHref legacyBehavior>
            <Button component="a" leftSection={<IconPlus size={16} />}>
              Add Site
            </Button>
          </Link>
        </Group>
      </Group>

      {sites.length === 0 ? (
        <Card withBorder padding="xl" radius="md">
          <Stack align="center" gap="md">
            <IconWorld size={48} stroke={1.5} />
            <Text fw={500} size="lg">
              No documentation sites indexed yet
            </Text>
            <Text c="dimmed" ta="center" maw={400}>
              Add your first documentation site to start building your
              searchable knowledge base.
            </Text>
            <Link href="/sites/new" passHref legacyBehavior>
              <Button component="a" leftSection={<IconPlus size={16} />}>
                Add Your First Site
              </Button>
            </Link>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {sites.map((site) => (
            <Card key={site.domain} withBorder padding="lg" radius="md">
              <Group justify="space-between" mb="xs">
                <Anchor
                  href={`/sites/${encodeURIComponent(site.domain)}`}
                  component={Link}
                  fw={500}
                  size="lg"
                  style={{ color: 'inherit' }}
                >
                  {site.name}
                </Anchor>
                <Badge color={getStatusColor(site.status)}>{site.status}</Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                {site.description || site.baseUrl}
              </Text>

              <Stack gap="xs">
                {site.status === 'indexed' && (
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Pages:
                    </Text>
                    <Text size="sm" fw={500}>
                      {site.pageCount}
                    </Text>
                  </Group>
                )}
                {site.status === 'discovered' && (
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Discovered:
                    </Text>
                    <Text size="sm" fw={500}>
                      {site.discoveredCount}
                    </Text>
                  </Group>
                )}
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    Last indexed:
                  </Text>
                  <Text size="sm" fw={500}>
                    {formatDate(site.lastIndexedAt)}
                  </Text>
                </Group>
              </Stack>

              <Group mt="md" gap="xs">
                <Link
                  href={`/sites/${encodeURIComponent(site.domain)}`}
                  passHref
                  legacyBehavior
                >
                  <Button component="a" size="xs" variant="light">
                    View Details
                  </Button>
                </Link>
                {site.status === 'indexed' && (
                  <Link
                    href={`/sites/${encodeURIComponent(site.domain)}/rediscover`}
                    passHref
                    legacyBehavior
                  >
                    <Button
                      component="a"
                      size="xs"
                      variant="outline"
                      leftSection={<IconRefresh size={14} />}
                    >
                      Re-index
                    </Button>
                  </Link>
                )}
                <DeleteSiteButton domain={site.domain} />
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  )
}
