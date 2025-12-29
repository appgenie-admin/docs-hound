'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Paper,
  Title,
  TextInput,
  Button,
  Stack,
  Text,
  Alert,
} from '@mantine/core'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = searchParams.get('from') || '/'

  useEffect(() => {
    // Clear error when password changes
    setError('')
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Invalid password')
        setLoading(false)
        return
      }

      // Success - redirect to the original page
      router.push(from)
      router.refresh()
    } catch (err) {
      console.error('[Login] Error:', err)
      setError('Failed to authenticate')
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <Container size="xs" style={{ marginTop: '10vh' }}>
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Stack gap="md">
          <div>
            <Title order={2} mb="xs">
              Docs Hound
            </Title>
            <Text size="sm" c="dimmed">
              Enter password to continue
            </Text>
          </div>

          {error && (
            <Alert color="red" title="Authentication Failed">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onKeyPress={handleKeyPress}
                required
                autoFocus
                disabled={loading}
              />

              <Button type="submit" fullWidth loading={loading}>
                Login
              </Button>
            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            Password is set via the UI_PASSWORD environment variable
          </Text>
        </Stack>
      </Paper>
    </Container>
  )
}
