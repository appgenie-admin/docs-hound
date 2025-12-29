'use client'

import {
  ActionIcon,
  Box,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from '@mantine/core'
import { IconSend, IconRobot, IconUser } from '@tabler/icons-react'
import { useEffect, useRef, useState, useCallback } from 'react'

interface ChatInterfaceProps {
  source: string | null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ChatInterface({ source }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
      }

      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            source,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        // Read the stream
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        let assistantContent = ''
        const assistantId = (Date.now() + 1).toString()

        // Add placeholder for assistant message
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '' },
        ])

        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantContent += chunk

          // Update assistant message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: assistantContent } : m
            )
          )
        }
      } catch (err) {
        console.error('Chat error:', err)
        setError(err instanceof Error ? err.message : 'Failed to send message')
      } finally {
        setIsLoading(false)
      }
    },
    [messages, source]
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      const message = inputValue.trim()
      setInputValue('')
      await sendMessage(message)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <Stack h="100%" gap={0}>
      <ScrollArea flex={1} viewportRef={scrollRef} p="md">
        {messages.length === 0 ? (
          <Stack align="center" justify="center" h="100%" gap="md">
            <IconRobot size={48} stroke={1.5} color="gray" />
            <Text c="dimmed" ta="center" maw={400}>
              Ask a question about your documentation. I&apos;ll search through
              all indexed sources to find relevant information.
            </Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {messages.map((message) => (
              <Paper
                key={message.id}
                p="md"
                radius="md"
                bg={message.role === 'user' ? 'blue.0' : 'gray.0'}
              >
                <Group align="flex-start" gap="sm">
                  <Box
                    p={6}
                    bg={message.role === 'user' ? 'blue.5' : 'gray.5'}
                    style={{ borderRadius: '50%' }}
                  >
                    {message.role === 'user' ? (
                      <IconUser size={16} color="white" />
                    ) : (
                      <IconRobot size={16} color="white" />
                    )}
                  </Box>
                  <Box flex={1}>
                    <Text
                      size="sm"
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {message.content || (isLoading ? '...' : '')}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role !== 'assistant' && (
                <Paper p="md" radius="md" bg="gray.0">
                  <Group gap="sm">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                      Searching documentation...
                    </Text>
                  </Group>
                </Paper>
              )}
            {error && (
              <Paper p="md" radius="md" bg="red.0">
                <Text size="sm" c="red">
                  Error: {error}
                </Text>
              </Paper>
            )}
          </Stack>
        )}
      </ScrollArea>

      <Box p="md" pt="0">
        <form onSubmit={onSubmit}>
          <Group gap="sm" align="flex-end">
            <Textarea
              ref={inputRef}
              placeholder="Ask a question about your documentation..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              minRows={1}
              maxRows={4}
              autosize
              style={{ flex: 1 }}
              disabled={isLoading}
            />
            <ActionIcon
              type="submit"
              size="lg"
              variant="filled"
              disabled={!inputValue.trim() || isLoading}
            >
              <IconSend size={18} />
            </ActionIcon>
          </Group>
        </form>
      </Box>
    </Stack>
  )
}
