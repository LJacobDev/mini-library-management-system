import { createError, readBody } from 'h3'
import {
  assertMediaFormat,
  assertMediaType,
  mapMediaRow,
  sanitizeIsoDate,
  sanitizeMetadata,
  sanitizeString,
  sanitizeUrl,
  toPositiveInteger,
} from '../../utils/adminMedia'
import { getSupabaseContext, normalizeSupabaseError } from '../../utils/supabaseApi'

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

export default defineEventHandler(async (event) => {
  const { supabase } = await getSupabaseContext(event, { roles: ['admin'] })

  const body = (await readBody<CreateMediaPayload>(event)) ?? {}

  const allowedFields = new Set([
    'title',
    'creator',
    'mediaType',
    'mediaFormat',
    'isbn',
    'genre',
    'subject',
    'description',
    'coverUrl',
    'language',
    'pages',
    'durationSeconds',
    'publishedAt',
    'metadata',
  ])

  const unexpectedKeys = Object.keys(body).filter((key) => !allowedFields.has(key))
  if (unexpectedKeys.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported field(s): ${unexpectedKeys.join(', ')}`,
    })
  }

  const title = sanitizeString(body.title, 200)
  const creator = sanitizeString(body.creator, 160)
  const rawMediaType = sanitizeString(body.mediaType, 32)
  const rawMediaFormat = sanitizeString(body.mediaFormat, 32)

  if (!title || !creator) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required media fields (title, creator, mediaType, mediaFormat).',
    })
  }

  if (!rawMediaType || !rawMediaFormat) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required media fields (mediaType, mediaFormat).',
    })
  }

  let mediaType: string | null = null
  let mediaFormat: string | null = null
  let metadata: Record<string, unknown>

  try {
    mediaType = assertMediaType(rawMediaType)
    mediaFormat = assertMediaFormat(rawMediaFormat)
    metadata = sanitizeMetadata('metadata' in body ? body.metadata ?? {} : {})
  } catch (error) {
    const message = error instanceof TypeError ? error.message : 'Invalid media payload.'
    throw createError({
      statusCode: 400,
      statusMessage: message,
    })
  }

  if (!mediaType || !mediaFormat) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required media fields (mediaType, mediaFormat).',
    })
  }

  const payload = {
    title,
    creator,
    media_type: mediaType,
    media_format: mediaFormat,
    isbn: sanitizeString(body.isbn, 32),
    genre: sanitizeString(body.genre, 120),
    subject: sanitizeString(body.subject, 120),
    description: sanitizeString(body.description, 2000),
    cover_url: sanitizeUrl(body.coverUrl),
    language: sanitizeString(body.language, 60),
    pages: toPositiveInteger(body.pages),
    duration_seconds: toPositiveInteger(body.durationSeconds),
    published_at: sanitizeIsoDate(body.publishedAt),
    metadata,
  }

  const { data, error } = await supabase.from('media').insert(payload).select('*').single()

  if (error || !data) {
    throw normalizeSupabaseError(error, 'Unable to create media item.')
  }

  return {
    item: mapMediaRow(data),
  }
})
