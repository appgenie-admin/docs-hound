import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Badge,
  Group,
} from '@mantine/core'

export default function Home() {
  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="md">
        Docs Hound
      </Title>
      <Text c="dimmed" mb="xl">
        Documentation search and indexing platform
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" mb="xs">
            <Text fw={500}>No sites indexed yet</Text>
            <Badge color="gray">Empty</Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Add your first documentation site to get started.
          </Text>
        </Card>
      </SimpleGrid>
    </Container>
  )
}
