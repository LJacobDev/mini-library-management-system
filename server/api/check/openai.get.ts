import { setHeader, setResponseStatus } from 'h3'

import { streamChatCompletion } from '../../utils/openaiClient'

export default defineEventHandler(async (event) => {
  const { req, res } = event.node
  let isClosed = false

  req.on('close', () => {
    isClosed = true
  })

  const stream = await streamChatCompletion({
    event,
    messages: [
      {
        role: 'system',
        content:
          'You are an observant assistant that confirms backend integrations are online for a small library management system.',
      },
      {
        role: 'user',
        content:
          'Confirm in one upbeat sentence that the OpenAI connection is healthy. Avoid markdown or lists.',
      },
    ],
  })

  setResponseStatus(event, 200)
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  res.flushHeaders?.()

  const writeEvent = (eventName: string, data: unknown) => {
    res.write(`event: ${eventName}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  writeEvent('status', { status: 'connected' })

  try {
    for await (const chunk of stream) {
      if (isClosed) {
        break
      }
      const delta = chunk.choices?.[0]?.delta?.content
      if (!delta) {
        continue
      }
      writeEvent('token', { delta })
    }
    writeEvent('done', { status: 'done' })
  } catch (error) {
    console.error('OpenAI streaming error', error)
    writeEvent('error', { message: 'Failed to stream OpenAI response.' })
  } finally {
    res.end()
  }
})
