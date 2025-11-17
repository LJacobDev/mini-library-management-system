import {
	computed,
	onBeforeUnmount,
	onMounted,
	ref,
	toValue,
	watch,
	type MaybeRefOrGetter,
} from '#imports'
export type StreamStatus =
	| 'idle'
	| 'connecting'
	| 'streaming'
	| 'completed'
	| 'error'

interface UseAiStreamOptions {
	url: MaybeRefOrGetter<string>
	autoStart?: boolean
}

interface StreamMessage {
	delta?: string
	status?: string
	message?: string
}

function parseEventData(raw: string): StreamMessage {
	try {
		return JSON.parse(raw) as StreamMessage
	} catch (error) {
		console.warn('Failed to parse SSE payload', error, raw)
		return { message: raw }
	}
}

const logStreamEvent = (label: string, payload?: unknown) => {
	console.info(`[AI Stream] ${label}`, payload ?? null)
}

export function useAiStream({ url, autoStart = false }: UseAiStreamOptions) {
	const streamText = ref('')
	const status = ref<StreamStatus>('idle')
	const errorMessage = ref<string | null>(null)

	let source: EventSource | null = null

	const closeStream = (reason?: string, payload?: unknown) => {
		if (reason) {
			logStreamEvent(`close:${reason}`, payload)
		}
		source?.close()
		source = null
	}

	const start = (targetUrl?: string) => {
		const resolvedUrl = targetUrl ?? toValue(url)
		if (!resolvedUrl) {
			return
		}

		closeStream('restart')
		streamText.value = ''
		errorMessage.value = null
		status.value = 'connecting'

		source = new EventSource(resolvedUrl)

		source.addEventListener('status', (event) => {
			const payload = parseEventData((event as MessageEvent).data)
			logStreamEvent('status', payload)
			if (payload.status) {
				status.value =
					payload.status === 'connected' ? 'connecting' : (payload.status as StreamStatus)
			}
		})

		source.addEventListener('token', (event) => {
			const payload = parseEventData((event as MessageEvent).data)
			if (payload.delta) {
				streamText.value += payload.delta
				status.value = 'streaming'
			}
		})

		source.addEventListener('done', (event) => {
			const payload = parseEventData((event as MessageEvent).data)
			logStreamEvent('done', payload)
			status.value = 'completed'
			closeStream('done', payload)
		})

		source.addEventListener('error', (event) => {
			const payload = parseEventData((event as MessageEvent).data)
			logStreamEvent('error', payload)
			errorMessage.value = payload.message ?? 'Stream failed.'
			status.value = 'error'
			closeStream('event-error', payload)
		})

		source.onerror = (nativeError) => {
			logStreamEvent('source-error', nativeError)
			if (status.value !== 'completed') {
				errorMessage.value = 'Connection lost.'
				status.value = 'error'
			}
			closeStream('source-error', nativeError)
		}
	}

	const stop = () => {
		closeStream('manual-stop')
	}

	if (autoStart) {
		onMounted(() => start())
	}

	watch(
		() => toValue(url),
		(newUrl, oldUrl) => {
			if (!newUrl || newUrl === oldUrl) {
				return
			}
			if (autoStart) {
				start(newUrl)
			}
		}
	)

	onBeforeUnmount(() => {
		closeStream()
	})

	return {
		text: computed(() => streamText.value),
		status: computed(() => status.value),
		error: computed(() => errorMessage.value),
		start,
		stop,
	}
}
