import { useRuntimeConfig } from '#imports'
import { createError } from 'h3'

interface StreamChatOptions {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  model?: string
}

export async function* streamChatCompletion({
  messages,
  model = 'gpt-4o-mini',
}: StreamChatOptions) {
  const config = useRuntimeConfig()
  const apiKey = config.openai?.apiKey || config.openaiApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key is not configured',
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    const errorPayload = await response.text().catch(() => '')
    throw createError({
      statusCode: response.status || 500,
      statusMessage: errorPayload || 'Failed to reach OpenAI',
    })
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const segments = buffer.split('\n\n')
    buffer = segments.pop() ?? ''

    for (const segment of segments) {
      const line = segment.trim()
      if (!line || line === 'data: [DONE]') {
        continue
      }

      if (!line.startsWith('data:')) {
        continue
      }

      const json = line.replace(/^data:\s*/, '')

      try {
        const payload = JSON.parse(json)
        const delta = payload.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta.length > 0) {
          yield delta
        }
      } catch (error) {
        console.warn('Failed to parse OpenAI stream chunk', error)
        continue
      }
    }
  }

  if (buffer.trim().length > 0 && buffer.trim() !== 'data: [DONE]') {
    for (const segment of buffer.split('\n\n')) {
      const line = segment.trim()
      if (!line || line === 'data: [DONE]') {
        continue
      }

      if (!line.startsWith('data:')) {
        continue
      }

      const json = line.replace(/^data:\s*/, '')

      try {
        const payload = JSON.parse(json)
        const delta = payload.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta.length > 0) {
          yield delta
        }
      } catch (error) {
        console.warn('Failed to parse trailing OpenAI chunk', error)
      }
    }
  }
}
