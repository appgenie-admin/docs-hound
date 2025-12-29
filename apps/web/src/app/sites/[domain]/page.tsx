import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Group,
  Button,
  Stack,
  Anchor,
  Loader,
  Alert,
  Paper,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconSearch,
} from '@tabler/icons-react'
import { notFound } from 'next/navigation'
import { getSiteRegistry, type Site } from '@docs-hound/shared-db'
import { DiscoveredUrlsList } from '@/components/DiscoveredUrlsList'
import { IndexedPagesList } from '@/components/IndexedPagesList'
import { SiteStatusPoller } from '@/components/SiteStatusPoller'

// Force dynamic rendering since we need runtime env vars
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ domain: string }>
}

async function getSite(domain: string): Promise<Site | null> {
  try {
    const registry = getSiteRegistry()
    const metadata = await registry.getSite(domain)
    if (!metadata) return null
    return { domain, ...metadata }
  } catch (error) {
    console.error('Failed to fetch site:', error)
    return null
  }
}

async function getDiscoveredUrls(domain: string): Promise<string[]> {
  try {
    const registry = getSiteRegistry()
    return await registry.getDiscoveredUrls(domain)
  } catch {
    return []
  }
}

async function getIndexedPages(domain: string): Promise<string[]> {
  try {
    const registry = getSiteRegistry()
    return await registry.getIndexedPages(domain)
  } catch {
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

export default async function SiteDetailPage({ params }: PageProps) {
  const { domain } = await params
  const decodedDomain = decodeURIComponent(domain)
  const site = await getSite(decodedDomain)

  if (!site) {
    notFound()
  }

  const discoveredUrls = await getDiscoveredUrls(decodedDomain)
  const indexedPages = await getIndexedPages(decodedDomain)

  const isProcessing =
    site.status === 'discovering' || site.status === 'indexing'

  return (
    <Container size="xl" py="xl">
      {/* Poll for status updates when processing */}
      {isProcessing && <SiteStatusPoller />}
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
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="md" mb="xs">
            <Title order={1}>{site.name}</Title>
            <Badge color={getStatusColor(site.status)} size="lg">
              {site.status}
            </Badge>
          </Group>
          <Text c="dimmed">{site.baseUrl}</Text>
          {site.description && (
            <Text c="dimmed" mt="xs">
              {site.description}
            </Text>
          )}
        </div>
      </Group>
      {/* Error State */}
      {site.status === 'error' && site.errorMessage && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          mb="lg"
        >
          {site.errorMessage}
        </Alert>
      )}
      {/* Pending State */}
      {site.status === 'pending' && (
        <Card withBorder padding="xl" radius="md">
          <Stack align="center" gap="md">
            <IconSearch size={48} stroke={1.5} />
            <Text fw={500} size="lg">
              Ready to Discover Pages
            </Text>
            <Text c="dimmed" ta="center" maw={400}>
              Click the button below to start crawling the site and discovering
              pages to index.
            </Text>
            <form action={`/api/discover`} method="POST">
              <input type="hidden" name="domain" value={site.domain} />
              <Button type="submit" leftSection={<IconSearch size={16} />}>
                Start Discovery
              </Button>
            </form>
          </Stack>
        </Card>
      )}
      {/* Discovering State */}
      {site.status === 'discovering' && (
        <Card withBorder padding="xl" radius="md">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text fw={500} size="lg">
              Discovering Pages...
            </Text>
            <Text c="dimmed" ta="center" maw={400}>
              We&apos;re crawling the site to discover all available pages. This
              may take a few minutes.
            </Text>
            {site.discoveredCount > 0 && (
              <Text size="sm" c="dimmed">
                Found {site.discoveredCount} pages so far...
              </Text>
            )}
          </Stack>
        </Card>
      )}
      {/* Discovered State - URL Review */}
      {site.status === 'discovered' && (
        <Paper withBorder p="xl" radius="md">
          <Group justify="space-between" mb="lg">
            <div>
              <Title order={3}>Review Discovered URLs</Title>
              <Text c="dimmed" size="sm">
                {discoveredUrls.length} pages found.{' '}
                {discoveredUrls.length >= 1000 && (
                  <Text span c="yellow" fw={500}>
                    Discovery limit reached (1000 pages max).
                  </Text>
                )}
              </Text>
            </div>
          </Group>
          <DiscoveredUrlsList domain={site.domain} urls={discoveredUrls} />
        </Paper>
      )}
      {/* Indexing State */}
      {site.status === 'indexing' && (
        <Card withBorder padding="xl" radius="md">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text fw={500} size="lg">
              Indexing Pages...
            </Text>
            <Text c="dimmed" ta="center" maw={400}>
              We&apos;re scraping and indexing the content. This may take a few
              minutes.
            </Text>
            {site.pageCount > 0 && (
              <Text size="sm" c="dimmed">
                Indexed {site.pageCount} pages so far...
              </Text>
            )}
          </Stack>
        </Card>
      )}
      {/* Indexed State */}
      {site.status === 'indexed' && (
        <Stack gap="lg">
          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between">
              <Group gap="xl">
                <div>
                  <Text size="sm" c="dimmed">
                    Pages Indexed
                  </Text>
                  <Text size="xl" fw={700}>
                    {site.pageCount}
                  </Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">
                    Last Indexed
                  </Text>
                  <Text size="xl" fw={700}>
                    {site.lastIndexedAt
                      ? new Date(site.lastIndexedAt).toLocaleDateString()
                      : 'Never'}
                  </Text>
                </div>
              </Group>
              <Group>
                <Button
                  component="a"
                  href={`/chat?source=${encodeURIComponent(site.domain)}`}
                  variant="light"
                  leftSection={<IconCheck size={16} />}
                >
                  Chat with Docs
                </Button>
                <form action={`/api/discover`} method="POST">
                  <input type="hidden" name="domain" value={site.domain} />
                  <Button
                    type="submit"
                    variant="outline"
                    leftSection={<IconRefresh size={16} />}
                  >
                    Re-discover
                  </Button>
                </form>
              </Group>
            </Group>
          </Card>

          <Paper withBorder p="xl" radius="md">
            <Title order={3} mb="md">
              Indexed Pages
            </Title>
            <IndexedPagesList urls={indexedPages} />
          </Paper>
        </Stack>
      )}
    </Container>
  )
}
