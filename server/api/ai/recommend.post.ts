import { createError, readBody, setHeader, setResponseStatus, type H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseContext, type AppRole } from '../../utils/supabaseApi'
import { chatCompletion, streamChatCompletion } from '../../utils/openaiClient'

const MAX_PROMPT_LENGTH = 800
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 20
const KEYWORD_MAX = 6
const SUMMARY_ITEM_LIMIT = 6

const STOP_WORDS = new Set(
  [
    'the',
    'and',
    'a',
    'an',
    'of',
    'for',
    'with',
    'about',
    'into',
    'into',
    'on',
    'in',
    'to',
    'from',
    'by',
    'at',
    'as',
    'is',
    'are',
    'be',
    'this',
    'that',
    'these',
    'those',
    'it',
    'its',
    'their',
    'my',
    'our',
    'your',
    'we',
    'you',
    'they',
    'them',
    'me',
    'i',
    'but',
    'so',
    'if',
    'or',
    'not',
    'no',
    'yes',
    'please',
    'would',
    'like',
    'looking',
    'need',
    'want',
    'maybe',
    'just',
    'can',
    'could',
    'should',
    'any',
  ]
)

const ROLE_PROMPT_PREFIX: Record<AppRole, string> = {
  member:
    'You are a friendly library concierge chatting directly with a member. Recommend 3-5 titles from the provided list, explain why each fits their interests, and close with an invitation to explore more.',
  librarian:
    'You are advising a fellow librarian. Highlight availability, audience fit, and any follow-up questions to confirm with the patron. Keep the tone professional yet warm.',
  admin:
    'You are briefing library leadership. Emphasise programming opportunities, collection strengths or gaps, and circulation insights that justify the picks.',
}

interface RecommendRequest {
  prompt: string
  filters?: {
    mediaType?: string
    mediaFormat?: string
    ageGroup?: string
    limit?: number
  }
}

interface KeywordExtractionResponse {
  keywords: string[]
  exclude?: string[]
}

interface KeywordResult {
  keywords: string[]
  exclude: string[]
  source: 'openai' | 'fallback'
  raw?: unknown
}

interface MediaRow {
  id: string
  title: string
  creator: string
  media_type: string
  media_format: string
  genre?: string | null
  subject?: string | null
  description?: string | null
  cover_url?: string | null
  published_at?: string | null
  metadata?: Record<string, unknown> | null
}

interface RecommendationItem {
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
}

interface SanitizedFilters {
  mediaType?: string
  mediaFormat?: string
  ageGroup?: string
  limit: number
}

function sanitizePrompt(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Prompt is required.' })
  }

  const trimmed = raw.trim()
  if (!trimmed.length) {
    throw createError({ statusCode: 400, statusMessage: 'Prompt is required.' })
  }

  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return trimmed.slice(0, MAX_PROMPT_LENGTH)
  }

  return trimmed
}

function sanitizeFilters(raw: RecommendRequest['filters']): SanitizedFilters {
  const limitRaw = raw?.limit
  let limit = DEFAULT_LIMIT
  if (typeof limitRaw === 'number' && Number.isFinite(limitRaw)) {
    limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(limitRaw)))
  }

  const normalize = (value?: string) =>
    value && typeof value === 'string' ? value.trim().toLowerCase() || undefined : undefined

  return {
    mediaType: normalize(raw?.mediaType),
    mediaFormat: normalize(raw?.mediaFormat),
    ageGroup: normalize(raw?.ageGroup),
    limit,
  }
}

function fallbackKeywords(prompt: string): string[] {
  const cleaned = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

  const unique: string[] = []
  for (const token of cleaned) {
    if (!unique.includes(token)) {
      unique.push(token)
    }
    if (unique.length >= KEYWORD_MAX) {
      break
    }
  }

  if (!unique.length) {
    unique.push(prompt.toLowerCase().slice(0, 20))
  }

  return unique
}

async function extractKeywords(event: H3Event, prompt: string): Promise<KeywordResult> {
  try {
    const completion = await chatCompletion({
      event,
      messages: [
        {
          role: 'system',
          content:
            'You condense library patron reading requests into 3-6 focused catalog search keywords. Return JSON matching the provided schema.',
        },
        {
          role: 'user',
          content: JSON.stringify({ prompt }),
        },
      ],
      temperature: 0.1,
      maxTokens: 200,
      model: 'gpt-4o-mini',
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'keywordExtraction',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              keywords: {
                type: 'array',
                minItems: 1,
                maxItems: KEYWORD_MAX,
                items: { type: 'string', minLength: 2 },
              },
              exclude: {
                type: 'array',
                minItems: 0,
                maxItems: KEYWORD_MAX,
                items: { type: 'string', minLength: 2 },
              },
            },
            required: ['keywords'],
          },
        },
      },
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      return {
        keywords: fallbackKeywords(prompt),
        exclude: [],
        source: 'fallback',
      }
    }

    const parsed = JSON.parse(content) as KeywordExtractionResponse
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.map((word) => word.trim()).filter(Boolean)
      : []
    const exclude = Array.isArray(parsed.exclude)
      ? parsed.exclude.map((word) => word.trim()).filter(Boolean)
      : []

    if (!keywords.length) {
      return {
        keywords: fallbackKeywords(prompt),
        exclude: [],
        source: 'fallback',
        raw: parsed,
      }
    }

    return {
      keywords: keywords.slice(0, KEYWORD_MAX),
      exclude: exclude.slice(0, KEYWORD_MAX),
      source: 'openai',
      raw: parsed,
    }
  } catch (error) {
    console.warn('Keyword extraction failed, using fallback.', error)
    return {
      keywords: fallbackKeywords(prompt),
      exclude: [],
      source: 'fallback',
      raw: error instanceof Error ? error.message : error,
    }
  }
}

function buildSearchPatterns(keywords: string[]): string[] {
  return keywords
    .map((keyword) => keyword.replace(/[\s%_]+/g, ' ').trim())
    .filter((keyword) => keyword.length > 1)
    .map((keyword) => `%${keyword.replace(/\s+/g, '%')}%`)
}

async function fetchCandidateMedia(
  supabase: SupabaseClient,
  keywords: string[],
  exclude: string[],
  filters: SanitizedFilters
) {
  const limit = Math.min(filters.limit + 4, MAX_LIMIT)
  let builder = supabase
    .from('media')
    .select(
      'id, title, creator, media_type, media_format, genre, subject, description, cover_url, published_at, metadata'
    )
    .order('published_at', { ascending: false })
    .limit(limit)

  if (filters.mediaType) {
    builder = builder.eq('media_type', filters.mediaType)
  }

  if (filters.mediaFormat) {
    builder = builder.eq('media_format', filters.mediaFormat)
  }

  const patterns = buildSearchPatterns(keywords)
  if (patterns.length) {
    const clauses: string[] = []
    for (const pattern of patterns) {
      clauses.push(`title.ilike.${pattern}`)
      clauses.push(`description.ilike.${pattern}`)
      clauses.push(`genre.ilike.${pattern}`)
      clauses.push(`subject.ilike.${pattern}`)
      clauses.push(`creator.ilike.${pattern}`)
    }
    builder = builder.or(clauses.join(','))
  }

  const excludePatterns = buildSearchPatterns(exclude)
  for (const pattern of excludePatterns) {
    builder = builder.not('description', 'ilike', pattern)
    builder = builder.not('genre', 'ilike', pattern)
    builder = builder.not('subject', 'ilike', pattern)
  }

  const { data, error } = await builder

  if (error) {
    console.error('[Recommendations] Supabase query failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch recommendations.' })
  }

  const rows = (data ?? []) as MediaRow[]

  return rows.map<RecommendationItem>((item) => ({
    id: item.id,
    title: item.title,
    author: item.creator,
    mediaType: item.media_type,
    mediaFormat: item.media_format,
    coverUrl: item.cover_url ?? null,
    subjects: [item.genre, item.subject].filter(Boolean) as string[],
    description: item.description ?? null,
    publishedAt: item.published_at ?? null,
    metadata: (item.metadata as Record<string, unknown>) ?? {},
  }))
}

function buildSummaryPrompt(role: AppRole): string {
  return ROLE_PROMPT_PREFIX[role] ?? ROLE_PROMPT_PREFIX.member
}

export default defineEventHandler(async (event) => {
  const { supabase, user, role } = await getSupabaseContext(event, {
    roles: ['member', 'librarian', 'admin'],
  })

  const body = await readBody<RecommendRequest>(event)
  const prompt = sanitizePrompt(body?.prompt)
  const filters = sanitizeFilters(body?.filters)
  const keywordResult = await extractKeywords(event, prompt)

  const items = await fetchCandidateMedia(supabase, keywordResult.keywords, keywordResult.exclude, filters)

  const response = event.node.res

  setResponseStatus(event, 200)
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  response.flushHeaders?.()

  const writeEvent = (eventName: string, data: unknown) => {
    response.write(`event: ${eventName}\n`)
    response.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  const closeHandler = () => {
    if (!response.writableEnded) {
      response.end()
    }
  }
  event.node.req.once('close', closeHandler)

  writeEvent('status', { status: 'connected' })
  writeEvent('metadata', {
    user: {
      id: user.id,
      role,
    },
    query: {
      prompt,
      filters,
      keywords: keywordResult.keywords,
      exclude: keywordResult.exclude,
      keywordSource: keywordResult.source,
    },
    items,
  })

  if (!items.length) {
    writeEvent('done', { status: 'no-results' })
    event.node.req.off('close', closeHandler)
    if (!response.writableEnded) {
      response.end()
    }
    return
  }

  try {
    const stream = await streamChatCompletion({
      event,
      model: 'gpt-4o-mini',
      temperature: 0.4,
      maxTokens: 320,
      messages: [
        { role: 'system', content: buildSummaryPrompt(role) },
        {
          role: 'user',
          content: JSON.stringify({
            prompt,
            keywords: keywordResult.keywords,
            candidates: items.slice(0, SUMMARY_ITEM_LIMIT).map((item) => ({
              title: item.title,
              author: item.author,
              mediaType: item.mediaType,
              mediaFormat: item.mediaFormat,
              subjects: item.subjects,
              description: item.description,
              metadata: item.metadata,
            })),
          }),
        },
      ],
    })

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (!delta) {
        continue
      }

      writeEvent('token', { delta })
    }

    writeEvent('done', { status: 'completed' })
  } catch (error) {
    console.error('[Recommendations] Streaming summary failed', error)
    writeEvent('error', { message: 'Unable to generate AI summary at this time.' })
  } finally {
    event.node.req.off('close', closeHandler)
    if (!response.writableEnded) {
      response.end()
    }
  }
})
