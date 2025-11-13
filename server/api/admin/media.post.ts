import { createError, readBody } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../../utils/supabaseApi'

const MEDIA_TYPES = new Set(['book', 'video', 'audio', 'other'])
const MEDIA_FORMATS = new Set(['print', 'ebook', 'audiobook', 'dvd', 'blu-ray'])

interface CreateMediaPayload {
  title?: string
  creator?: string
  mediaType?: string
  mediaFormat?: string
  isbn?: string | null
  genre?: string | null
  subject?: string | null
  description?: string | null
  coverUrl?: string | null
  language?: string | null
  pages?: number | null
  durationSeconds?: number | null
  publishedAt?: string | null
  metadata?: Record<string, unknown> | null
}

function sanitizeString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

export default defineEventHandler(async (event) => {
  const { supabase } = await getSupabaseContext(event, { roles: ['admin'] })

  const body = (await readBody<CreateMediaPayload>(event)) ?? {}

  const title = sanitizeString(body.title)
  const creator = sanitizeString(body.creator)
  const mediaType = sanitizeString(body.mediaType)
  const mediaFormat = sanitizeString(body.mediaFormat)

  if (!title || !creator || !mediaType || !mediaFormat) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required media fields (title, creator, mediaType, mediaFormat).',
    })
  }

  if (!MEDIA_TYPES.has(mediaType)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid mediaType. Expected one of: ${Array.from(MEDIA_TYPES).join(', ')}.`,
    })
  }

  if (!MEDIA_FORMATS.has(mediaFormat)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid mediaFormat. Expected one of: ${Array.from(MEDIA_FORMATS).join(', ')}.`,
    })
  }

  const payload = {
    title,
    creator,
    media_type: mediaType,
    media_format: mediaFormat,
    isbn: sanitizeString(body.isbn),
    genre: sanitizeString(body.genre),
    subject: sanitizeString(body.subject),
    description: sanitizeString(body.description),
    cover_url: sanitizeString(body.coverUrl),
    language: sanitizeString(body.language),
    pages: typeof body.pages === 'number' && Number.isFinite(body.pages) ? Math.max(1, Math.floor(body.pages)) : null,
    duration_seconds:
      typeof body.durationSeconds === 'number' && Number.isFinite(body.durationSeconds)
        ? Math.max(1, Math.floor(body.durationSeconds))
        : null,
    published_at: sanitizeString(body.publishedAt),
    metadata: body.metadata ?? {},
  }

  const { data, error } = await supabase.from('media').insert(payload).select('*').single()

  if (error || !data) {
    throw normalizeSupabaseError(error, 'Unable to create media item.')
  }

  return {
    item: {
      id: data.id,
      title: data.title,
      author: data.creator,
      mediaType: data.media_type,
      mediaFormat: data.media_format,
      isbn: data.isbn,
      genre: data.genre,
      subject: data.subject,
      description: data.description,
      coverUrl: data.cover_url,
      language: data.language,
      pages: data.pages,
      durationSeconds: data.duration_seconds,
      publishedAt: data.published_at,
      metadata: data.metadata ?? {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  }
})
