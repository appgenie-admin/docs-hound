import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { searchDocsTool } from '@docs-hound/tool-docs-search'

const SYSTEM_PROMPT = `You are Docs Hound, an AI assistant that helps users find information in their indexed documentation.

You have access to semantic search across all indexed documentation sites. When users ask questions:
1. Search the documentation to find relevant information
2. Synthesize the results into a clear, helpful answer
3. Include relevant links to the source documentation
4. If you can't find relevant information, let the user know

Be concise but thorough. Quote relevant parts of the documentation when appropriate.
If the user asks about a specific documentation source, use the source filter in your search.`

// Simple message type for the chat interface
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatAgentOptions {
  source?: string
  messages: ChatMessage[]
}

/**
 * Run the chat agent with streaming response
 * Returns a Response object with the streamed text result
 */
export async function runChatAgent(
  options: ChatAgentOptions
): Promise<Response> {
  const { source, messages } = options

  // Verify OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  // Prepare system prompt with source context
  let systemPrompt = SYSTEM_PROMPT
  if (source) {
    systemPrompt += `\n\nThe user is currently viewing documentation from: ${source}. Prioritize searching this source first.`
  }

  console.log(`[ChatAgent] Running with ${messages.length} messages`)

  // Run with streaming
  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages,
    tools: {
      searchDocs: searchDocsTool,
    },
  })

  return result.toTextStreamResponse()
}

// Re-export tools
export { searchDocsTool }
