import { onBeforeUnmount, ref, watch } from '#imports'

type MaybeGetter<T> = T | (() => T)

interface UseAiStreamOptions {
  immediate?: boolean
  restartOnUrlChange?: boolean
}

export function useAiStream(
  endpoint: MaybeGetter<string>,
  { immediate = true, restartOnUrlChange = true }: UseAiStreamOptions = {}
) {
  const message = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let source: EventSource | null = null

  const resolveEndpoint = () => {
    const value = typeof endpoint === 'function' ? (endpoint as () => string)() : endpoint
    return value
  }

  const stop = () => {
    if (source) {
      source.close()
      source = null
    }
    isLoading.value = false
  }

  const start = () => {
    if (!import.meta.client) {
      return
    }

    const url = resolveEndpoint()
    if (!url) {
      return
    }

    stop()
    message.value = ''
    error.value = null
    isLoading.value = true

    source = new EventSource(url)

    source.onmessage = (event) => {
      if (event.data && event.data !== '[DONE]') {
        message.value += event.data
      }
    }

    source.addEventListener('done', () => {
      stop()
    })

    source.addEventListener('error', (event) => {
      const eventWithData = event as MessageEvent
      if (eventWithData.data) {
        try {
          error.value = JSON.parse(eventWithData.data)
        } catch {
          error.value = eventWithData.data
        }
      } else {
        error.value = 'Stream reported an error.'
      }
      stop()
    })

    source.onerror = () => {
      if (!error.value) {
        error.value = 'Stream connection failed.'
      }
      stop()
    }
  }

  if (immediate && import.meta.client) {
    start()
  }

  if (restartOnUrlChange && typeof endpoint === 'function') {
    watch(() => (endpoint as () => string)(), () => {
      start()
    })
  }

  onBeforeUnmount(stop)

  return {
    message,
    isLoading,
    error,
    start,
    stop,
  }
}
