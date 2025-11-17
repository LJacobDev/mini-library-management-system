import OpenAI from 'openai'
import { createError, type H3Event } from 'h3'

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

interface ChatCompletionParams extends StreamChatParams {
	responseFormat?: Parameters<OpenAI['chat']['completions']['create']>[0]['response_format']
}

export async function streamChatCompletion({
	event,
	messages,
	model = 'gpt-4o-mini',
	temperature = 0.2,
	maxTokens = 400,
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

export async function chatCompletion({
	event,
	messages,
	model = 'gpt-4o-mini',
	temperature = 0.2,
	maxTokens = 400,
	responseFormat,
}: ChatCompletionParams) {
	const client = getClient(event)

	return client.chat.completions.create({
		model,
		messages,
		temperature,
		max_tokens: maxTokens,
		response_format: responseFormat,
	})
}
