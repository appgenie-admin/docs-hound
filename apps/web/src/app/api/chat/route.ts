import { NextRequest } from 'next/server'
import { runChatAgent, type ChatMessage } from '@docs-hound/agent-chat'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, source } = body as {
      messages: Array<{ role: string; content: string }>
      source?: string
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required', { status: 400 })
    }

    // Convert messages to the expected format
    const chatMessages: ChatMessage[] = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await runChatAgent({
      messages: chatMessages,
      source,
    })

    // runChatAgent already returns a Response
    return response
  } catch (error) {
    console.error('[Chat API] Error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
