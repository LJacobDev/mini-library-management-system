import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  toValue,
  type MaybeRefOrGetter,
} from '#imports'

export type AgentChatStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error'

export interface AgentChatFilters {
  mediaType?: string
  mediaFormat?: string
  ageGroup?: string
  limit?: number
}

export interface AgentChatMetadata {
  user: {
    id: string
    role: string
  }
  query: {
    prompt: string
    filters: Record<string, unknown>
    keywords: string[]
    exclude: string[]
    keywordSource: string
  }
  items: Array<{
    id: string
    title: string
    author: string
    mediaType: string
    mediaFormat: string
    coverUrl: string | null
    subjects: string[]
    description: string | null
    publishedAt: string | null
    metadata: Record<string, unknown>
  }>
}

interface UseAgentChatOptions {
  endpoint?: MaybeRefOrGetter<string>
}

interface ParsedEvent {
  event?: string
  data?: string
}

function parseEventBlock(raw: string): ParsedEvent {
  const lines = raw.split('\n')
  const parsed: ParsedEvent = {}

  for (const line of lines) {
    if (line.startsWith('event:')) {
      parsed.event = line.slice('event:'.length).trim()
    } else if (line.startsWith('data:')) {
      const existing = parsed.data ?? ''
      const fragment = line.slice('data:'.length).trim()
      parsed.data = existing.length ? `${existing}\n${fragment}` : fragment
    }
  }

  return parsed
}

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const endpoint = options.endpoint ?? '/api/ai/recommend'

  const status = ref<AgentChatStatus>('idle')
  const summary = ref('')
  const metadata = ref<AgentChatMetadata | null>(null)
  const errorMessage = ref<string | null>(null)

  const state = reactive({
    lastPrompt: '' as string,
    filters: null as AgentChatFilters | null,
  })

  let abortController: AbortController | null = null
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  const decoder = new TextDecoder()

  const reset = () => {
    summary.value = ''
    metadata.value = null
    errorMessage.value = null
  }

  const closeStream = async () => {
    abortController?.abort()
    abortController = null

    if (reader) {
      try {
        await reader.cancel()
      } catch {
        /* noop */
      }
    }
    reader = null
  }

  const handleEvent = (parsed: ParsedEvent) => {
    if (!parsed.event || !parsed.data) {
      return
    }

    try {
      const payload = JSON.parse(parsed.data)
      switch (parsed.event) {
        case 'status': {
          if (payload.status === 'connected') {
            status.value = 'connecting'
          }
          break
        }
        case 'metadata': {
          metadata.value = payload as AgentChatMetadata
          break
        }
        case 'token': {
          if (typeof payload.delta === 'string') {
            summary.value += payload.delta
            status.value = 'streaming'
          }
          break
        }
        case 'error': {
          errorMessage.value = payload.message ?? 'Unable to complete request.'
          status.value = 'error'
          break
        }
        case 'done': {
          status.value = payload.status === 'no-results' ? 'completed' : 'completed'
          break
        }
        default:
          break
      }
    } catch (error) {
      console.warn('Failed to parse agent chat payload', error, parsed)
    }
  }

  const pumpStream = async () => {
    if (!reader) {
      return
    }

    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)

        const parsed = parseEventBlock(rawEvent)
        handleEvent(parsed)

        boundary = buffer.indexOf('\n\n')
      }
    }

    if (buffer.trim().length) {
      const parsed = parseEventBlock(buffer)
      handleEvent(parsed)
    }
  }

  const sendPrompt = async (prompt: string, filters?: AgentChatFilters) => {
    const resolvedEndpoint = toValue(endpoint)
    if (!resolvedEndpoint) {
      throw new Error('Agent chat endpoint is not defined.')
    }

    await closeStream()
    reset()

    state.lastPrompt = prompt
    state.filters = filters ?? null

    status.value = 'connecting'

    abortController = new AbortController()

    try {
      const response = await fetch(resolvedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ prompt, filters }),
        signal: abortController.signal,
        credentials: 'same-origin',
      })

      if (!response.ok || !response.body) {
        let detail = `Request failed with status ${response.status}`
        try {
          const text = await response.text()
          if (text) {
            try {
              const parsed = JSON.parse(text)
              if (typeof parsed === 'string') {
                detail = parsed
              } else if (parsed && typeof parsed === 'object') {
                detail = (parsed as { message?: string; statusMessage?: string }).message ??
                  (parsed as { message?: string; statusMessage?: string }).statusMessage ??
                  JSON.stringify(parsed)
              } else {
                detail = text
              }
            } catch {
              detail = text
            }
          }
        } catch (error) {
          console.debug('Failed to read error body', error)
        }

        throw new Error(detail)
      }

      reader = response.body.getReader()
      await pumpStream()

      if (status.value === 'connecting') {
        status.value = 'completed'
      } else if (status.value === 'streaming') {
        status.value = 'completed'
      }
    } catch (error) {
      if ((error instanceof DOMException && error.name === 'AbortError') || (error as Error).name === 'AbortError') {
        status.value = 'idle'
      } else {
        console.error('Agent chat request failed', error)
        errorMessage.value = (error as Error).message ?? 'Unexpected error occurred.'
        status.value = 'error'
      }
    } finally {
      await closeStream()
    }
  }

  const cancel = async () => {
    await closeStream()
    status.value = 'idle'
  }

  onBeforeUnmount(() => {
    closeStream()
  })

  return {
    status: computed(() => status.value),
    summary: computed(() => summary.value),
    metadata: computed(() => metadata.value),
    error: computed(() => errorMessage.value),
    lastPrompt: computed(() => state.lastPrompt),
    filters: computed(() => state.filters),
    isStreaming: computed(() => status.value === 'connecting' || status.value === 'streaming'),
    sendPrompt,
    cancel,
  }
}
