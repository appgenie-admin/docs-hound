'use client'

import { useState } from 'react'
import {
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  ActionIcon,
  Paper,
  Accordion,
  Alert,
  Code,
} from '@mantine/core'
import { IconPlus, IconTrash, IconInfoCircle } from '@tabler/icons-react'

export interface UrlFilters {
  includePatterns: string[]
  excludePatterns: string[]
}

interface UrlFiltersFormProps {
  initialFilters?: UrlFilters
  onChange?: (filters: UrlFilters) => void
  showExamples?: boolean
}

export function UrlFiltersForm({
  initialFilters,
  onChange,
  showExamples = true,
}: UrlFiltersFormProps) {
  const [includePatterns, setIncludePatterns] = useState<string[]>(
    initialFilters?.includePatterns || []
  )
  const [excludePatterns, setExcludePatterns] = useState<string[]>(
    initialFilters?.excludePatterns || []
  )

  const handleIncludeChange = (index: number, value: string) => {
    const newPatterns = [...includePatterns]
    newPatterns[index] = value
    setIncludePatterns(newPatterns)
    onChange?.({ includePatterns: newPatterns, excludePatterns })
  }

  const handleExcludeChange = (index: number, value: string) => {
    const newPatterns = [...excludePatterns]
    newPatterns[index] = value
    setExcludePatterns(newPatterns)
    onChange?.({ includePatterns, excludePatterns: newPatterns })
  }

  const addIncludePattern = () => {
    const newPatterns = [...includePatterns, '']
    setIncludePatterns(newPatterns)
    onChange?.({ includePatterns: newPatterns, excludePatterns })
  }

  const addExcludePattern = () => {
    const newPatterns = [...excludePatterns, '']
    setExcludePatterns(newPatterns)
    onChange?.({ includePatterns, excludePatterns: newPatterns })
  }

  const removeIncludePattern = (index: number) => {
    const newPatterns = includePatterns.filter((_, i) => i !== index)
    setIncludePatterns(newPatterns)
    onChange?.({ includePatterns: newPatterns, excludePatterns })
  }

  const removeExcludePattern = (index: number) => {
    const newPatterns = excludePatterns.filter((_, i) => i !== index)
    setExcludePatterns(newPatterns)
    onChange?.({ includePatterns, excludePatterns: newPatterns })
  }

  return (
    <Stack gap="lg">
      {showExamples && (
        <Accordion variant="contained">
          <Accordion.Item value="help">
            <Accordion.Control icon={<IconInfoCircle size={20} />}>
              How URL Filters Work
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text size="sm">
                  URL filters use regular expressions to control which pages are
                  crawled:
                </Text>

                <div>
                  <Text size="sm" fw={500} mb={4}>
                    Include Patterns (Optional)
                  </Text>
                  <Text size="sm" c="dimmed">
                    If specified, ONLY URLs matching at least one include
                    pattern will be crawled. Leave empty to include all URLs by
                    default.
                  </Text>
                </div>

                <div>
                  <Text size="sm" fw={500} mb={4}>
                    Exclude Patterns (Optional)
                  </Text>
                  <Text size="sm" c="dimmed">
                    URLs matching any exclude pattern will be skipped. Applied
                    after include patterns.
                  </Text>
                </div>

                <Alert color="blue" variant="light">
                  <Text size="sm" fw={500} mb={4}>
                    Common Examples:
                  </Text>
                  <Stack gap={4}>
                    <Text size="xs" ff="monospace">
                      <Code>^https://v7\.mantine\.dev/</Code> - Match v7 Mantine
                      docs
                    </Text>
                    <Text size="xs" ff="monospace">
                      <Code>^https://nextjs\.org/docs/app/</Code> - Match
                      Next.js App Router docs
                    </Text>
                    <Text size="xs" ff="monospace">
                      <Code>/docs/15/</Code> - Exclude version 15 docs
                    </Text>
                    <Text size="xs" ff="monospace">
                      <Code>/v[0-9]+\.</Code> - Exclude versioned paths (v1.,
                      v2., etc.)
                    </Text>
                  </Stack>
                </Alert>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      <Paper withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text fw={500} size="sm">
                Include Patterns
              </Text>
              <Text size="xs" c="dimmed">
                Only crawl URLs matching these patterns (leave empty to include
                all)
              </Text>
            </div>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={addIncludePattern}
            >
              Add Pattern
            </Button>
          </Group>

          {includePatterns.length === 0 ? (
            <Text size="sm" c="dimmed" fs="italic">
              No include patterns - all URLs will be considered
            </Text>
          ) : (
            <Stack gap="xs">
              {includePatterns.map((pattern, index) => (
                <Group key={index} gap="xs">
                  <TextInput
                    placeholder="e.g. ^https://v7\.mantine\.dev/"
                    value={pattern}
                    onChange={(e) => handleIncludeChange(index, e.target.value)}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeIncludePattern(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text fw={500} size="sm">
                Exclude Patterns
              </Text>
              <Text size="xs" c="dimmed">
                Skip URLs matching these patterns
              </Text>
            </div>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={addExcludePattern}
            >
              Add Pattern
            </Button>
          </Group>

          {excludePatterns.length === 0 ? (
            <Text size="sm" c="dimmed" fs="italic">
              No exclude patterns - no URLs will be filtered out
            </Text>
          ) : (
            <Stack gap="xs">
              {excludePatterns.map((pattern, index) => (
                <Group key={index} gap="xs">
                  <TextInput
                    placeholder="e.g. /docs/15/"
                    value={pattern}
                    onChange={(e) => handleExcludeChange(index, e.target.value)}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeExcludePattern(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
