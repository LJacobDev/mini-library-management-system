import { createError, getRouterParam, readBody } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../../../utils/supabaseApi'

const MEDIA_TYPES = new Set(['book', 'video', 'audio', 'other'])
const MEDIA_FORMATS = new Set(['print', 'ebook', 'audiobook', 'dvd', 'blu-ray'])

interface UpdateMediaPayload {
  title?: string | null
  creator?: string | null
  mediaType?: string | null
  mediaFormat?: string | null
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
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing media ID.',
    })
  }

  const { supabase } = await getSupabaseContext(event, { roles: ['admin'] })
  const body = (await readBody<UpdateMediaPayload>(event)) ?? {}

  const updates: Record<string, unknown> = {}

  if ('title' in body) updates.title = sanitizeString(body.title)
  if ('creator' in body) updates.creator = sanitizeString(body.creator)
  if ('mediaType' in body) {
    const mediaType = sanitizeString(body.mediaType)
    if (mediaType && !MEDIA_TYPES.has(mediaType)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid mediaType. Expected one of: ${Array.from(MEDIA_TYPES).join(', ')}.`,
      })
    }
    updates.media_type = mediaType
  }
  if ('mediaFormat' in body) {
    const mediaFormat = sanitizeString(body.mediaFormat)
    if (mediaFormat && !MEDIA_FORMATS.has(mediaFormat)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid mediaFormat. Expected one of: ${Array.from(MEDIA_FORMATS).join(', ')}.`,
      })
    }
    updates.media_format = mediaFormat
  }
  if ('isbn' in body) updates.isbn = sanitizeString(body.isbn)
  if ('genre' in body) updates.genre = sanitizeString(body.genre)
  if ('subject' in body) updates.subject = sanitizeString(body.subject)
  if ('description' in body) updates.description = sanitizeString(body.description)
  if ('coverUrl' in body) updates.cover_url = sanitizeString(body.coverUrl)
  if ('language' in body) updates.language = sanitizeString(body.language)
  if ('pages' in body) {
    const pages = body.pages
    updates.pages = typeof pages === 'number' && Number.isFinite(pages) ? Math.max(1, Math.floor(pages)) : null
  }
  if ('durationSeconds' in body) {
    const duration = body.durationSeconds
    updates.duration_seconds =
      typeof duration === 'number' && Number.isFinite(duration) ? Math.max(1, Math.floor(duration)) : null
  }
  if ('publishedAt' in body) updates.published_at = sanitizeString(body.publishedAt)
  if ('metadata' in body && body.metadata) updates.metadata = body.metadata

  if (Object.keys(updates).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No valid fields provided for update.',
    })
  }

  const { data, error } = await supabase.from('media').update(updates).eq('id', id).select('*').single()

  if (error || !data) {
    throw normalizeSupabaseError(error, 'Unable to update media item.')
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
