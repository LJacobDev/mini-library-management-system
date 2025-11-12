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

export function useAiStream({ url, autoStart = false }: UseAiStreamOptions) {
	const streamText = ref('')
	const status = ref<StreamStatus>('idle')
	const errorMessage = ref<string | null>(null)

	let source: EventSource | null = null

	const closeStream = () => {
		source?.close()
		source = null
	}

	const start = (targetUrl?: string) => {
		const resolvedUrl = targetUrl ?? toValue(url)
		if (!resolvedUrl) {
			return
		}

		closeStream()
		streamText.value = ''
		errorMessage.value = null
		status.value = 'connecting'

		source = new EventSource(resolvedUrl)

		source.addEventListener('status', (event) => {
			const payload = parseEventData((event as MessageEvent).data)
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

		source.addEventListener('done', () => {
			status.value = 'completed'
			closeStream()
		})

		source.addEventListener('error', (event) => {
			const payload = parseEventData((event as MessageEvent).data)
			errorMessage.value = payload.message ?? 'Stream failed.'
			status.value = 'error'
			closeStream()
		})

		source.onerror = () => {
			if (status.value !== 'completed') {
				errorMessage.value = 'Connection lost.'
				status.value = 'error'
			}
			closeStream()
		}
	}

	const stop = () => {
		closeStream()
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
