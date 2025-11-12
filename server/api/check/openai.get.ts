import { streamChatCompletion } from '../../utils/openaiClient'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')

  const samplePrompt =
    'You are a friendly library assistant. Provide one short sentence confirming the OpenAI health check is working.'

  const write = (payload: string) => {
    event.node.res.write(payload)
    if (typeof (event.node.res as any).flush === 'function') {
      ;(event.node.res as any).flush()
    }
  }

  try {
    for await (const chunk of streamChatCompletion({
      messages: [{ role: 'user', content: samplePrompt }],
    })) {
      for (const line of chunk.split(/\r?\n/)) {
        write(`data: ${line}\n`)
      }
      write('\n')
    }

    write('event: done\ndata: [DONE]\n\n')
  } catch (error: any) {
    const message =
      error?.statusMessage || error?.message || 'OpenAI streaming failed'
    write(`event: error\ndata: ${JSON.stringify(message)}\n\n`)
  } finally {
    event.node.res.end()
  }
})
