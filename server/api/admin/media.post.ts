import { createError, readBody } from 'h3'
import {
  assertMediaFormat,
  assertMediaType,
  mapMediaRow,
  sanitizeString,
  toMetadata,
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

  const title = sanitizeString(body.title)
  const creator = sanitizeString(body.creator)
  const rawMediaType = sanitizeString(body.mediaType)
  const rawMediaFormat = sanitizeString(body.mediaFormat)

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
    metadata = toMetadata('metadata' in body ? body.metadata ?? {} : {})
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
    isbn: sanitizeString(body.isbn),
    genre: sanitizeString(body.genre),
    subject: sanitizeString(body.subject),
    description: sanitizeString(body.description),
    cover_url: sanitizeString(body.coverUrl),
    language: sanitizeString(body.language),
    pages: toPositiveInteger(body.pages),
    duration_seconds: toPositiveInteger(body.durationSeconds),
    published_at: sanitizeString(body.publishedAt),
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
