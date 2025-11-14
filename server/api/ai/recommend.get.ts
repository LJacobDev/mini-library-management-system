import { getQuery, type H3Event } from 'h3'
import { getSupabaseContext, normalizeSupabaseError, type AppRole } from '../../utils/supabaseApi'
import { streamChatCompletion } from '../../utils/openaiClient'

const MAX_LIMIT = 8
const DEFAULT_LIMIT = 4
const ALLOWED_MEDIA_TYPES = new Set(['book', 'video', 'audio', 'other'])

const ROLE_PROMPT_PREFIX: Record<AppRole, string> = {
  member: 'You are a friendly reading concierge speaking directly to a library member. Highlight delight, approachability, and next steps for visiting the branch or placing a hold.',
  librarian:
    'You are an experienced librarian helping a colleague serve a patron. Emphasise availability signals, potential follow-up questions, and any policy reminders for the circulation desk.',
  admin:
    'You are a collection manager briefing leadership. Focus on why these picks matter for programming, circulation health, or gaps we should address in acquisitions.',
}

function parseLimit(rawLimit: unknown) {
  if (typeof rawLimit === 'number' && Number.isFinite(rawLimit)) {
    return clampLimit(rawLimit)
  }

  if (typeof rawLimit === 'string') {
    const parsed = parseInt(rawLimit, 10)
    if (!Number.isNaN(parsed)) {
      return clampLimit(parsed)
    }
  }

  return DEFAULT_LIMIT
}

function clampLimit(value: number) {
  return Math.min(Math.max(1, Math.floor(value)), MAX_LIMIT)
}

function resolveMediaType(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized.length || normalized === 'all') {
    return null
  }

  return ALLOWED_MEDIA_TYPES.has(normalized) ? normalized : null
}

interface MediaRow {
  id: string
  title: string
  creator: string
  media_type: string
  genre?: string | null
  subject?: string | null
  description?: string | null
  cover_url?: string | null
  published_at?: string | null
  metadata?: Record<string, unknown> | null
}

interface Recommendation {
  id: string
  title: string
  author: string
  mediaType: string
  coverUrl: string | null
  synopsis: string | null
  publishedAt: string | null
  metadata: Record<string, unknown>
  matchScore: number
  reason: string
}

function buildSystemPrompt(role: AppRole): string {
  const base =
    'Draft a warm single-paragraph summary (max 3 sentences) introducing the following recommendation list in plain text. Close with an invitation to explore more titles if appropriate.'

  const rolePrefix = ROLE_PROMPT_PREFIX[role] ?? ROLE_PROMPT_PREFIX.member
  return `${rolePrefix} ${base}`
}

function buildReason(item: MediaRow, search: string | null, index: number) {
  const subject = [item.genre, item.subject].filter(Boolean).join(' / ')
  const base = subject ? `Touches on ${subject}.` : 'Matches your stated interests.'

  if (search) {
    const matchingFields = [
      item.title ? 'title' : null,
      item.description ? 'description' : null,
      item.subject ? 'subject' : null,
      item.genre ? 'genre' : null,
    ]
      .filter(Boolean)
      .join(', ')

    return `Matches "${search}" in ${matchingFields || 'our catalog metadata'}. ${base}`
  }

  if (index === 0) {
    return `Popular pick from our recent arrivals. ${base}`
  }

  return base
}

type CompletionChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null
    } | null
  }>
}

async function buildAiSummary(event: H3Event, role: AppRole, intent: string | null, recommendations: Recommendation[]) {
  if (!recommendations.length) {
    return null
  }

  try {
    const completion = await streamChatCompletion({
      event,
      temperature: 0.45,
      maxTokens: 1000,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(role),
        },
        {
          role: 'user',
          content: JSON.stringify({
            intent,
            recommendations: recommendations.map((item) => ({
              title: item.title,
              author: item.author,
              mediaType: item.mediaType,
              reason: item.reason,
            })),
          }),
        },
      ],
    })

    const chunks: string[] = []
    for await (const part of completion as AsyncIterable<CompletionChunk>) {
      const delta = part?.choices?.[0]?.delta?.content
      if (delta) {
        chunks.push(delta)
      }
    }

    const summary = chunks.join('').trim()
    return summary.length ? summary : null
  } catch (error) {
    console.error('[Recommendations] OpenAI summary failed', error)
    return null
  }
}

export default defineEventHandler(async (event) => {
  const { supabase, user, role } = await getSupabaseContext(event, { roles: ['member', 'librarian', 'admin'] })
  const query = getQuery(event)

  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const mediaType = resolveMediaType(query.type)
  const limit = parseLimit(query.limit)

  let builder = supabase
    .from('media')
    .select('id, title, creator, media_type, genre, subject, description, cover_url, published_at, metadata')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (mediaType) {
    builder = builder.eq('media_type', mediaType)
  }

  if (search.length) {
    const like = `%${search}%`
    builder = builder.or(
      ['title.ilike.', 'description.ilike.', 'genre.ilike.', 'subject.ilike.', 'creator.ilike.']
        .map((field) => `${field}${like}`)
        .join(',')
    )
  }

  const { data, error } = await builder

  if (error) {
    throw normalizeSupabaseError(error, 'Unable to generate recommendations right now.')
  }

  const recommendations: Recommendation[] = (data ?? []).map((item: MediaRow, index: number) => ({
    id: item.id,
    title: item.title,
    author: item.creator,
    mediaType: item.media_type,
    coverUrl: item.cover_url ?? null,
    synopsis: item.description ?? null,
    publishedAt: item.published_at ?? null,
    metadata: (item.metadata as Record<string, unknown>) ?? {},
    matchScore: Number(Math.max(0.1, 1 - index * 0.15).toFixed(2)),
    reason: buildReason(item, search || null, index),
  }))

  if (!recommendations.length) {
    return {
      userId: user.id,
      query: {
        q: search || null,
        mediaType,
        limit,
      },
      recommendations,
      summary: null,
    }
  }

  const summary = await buildAiSummary(event, role, search || null, recommendations)

  return {
    userId: user.id,
    query: {
      q: search || null,
      mediaType,
      limit,
    },
    recommendations,
    summary,
  }
})
