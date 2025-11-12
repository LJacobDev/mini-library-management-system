import OpenAI from 'openai'
import type { H3Event } from 'h3'

type ChatMessage = {
	role: 'system' | 'user' | 'assistant'
	content: string
}

let cachedClient: OpenAI | null = null

function getClient(event: H3Event): OpenAI {
	const {
		server: { openaiApiKey },
	} = useRuntimeConfig(event)

	if (!openaiApiKey) {
		throw createError({
			statusCode: 500,
			statusMessage: 'OpenAI API key is not configured.',
		})
	}

	if (!cachedClient) {
		cachedClient = new OpenAI({ apiKey: openaiApiKey })
	}

	return cachedClient
}

interface StreamChatParams {
	event: H3Event
	messages: ChatMessage[]
	model?: string
	temperature?: number
	maxTokens?: number
}

export async function streamChatCompletion({
	event,
	messages,
	model = 'gpt-4o-mini',
	temperature = 0.2,
	maxTokens = 200,
}: StreamChatParams) {
	const client = getClient(event)

	return client.chat.completions.create({
		model,
		messages,
		stream: true,
		temperature,
		max_tokens: maxTokens,
	})
}
