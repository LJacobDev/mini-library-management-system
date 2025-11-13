import { createError, getRouterParam, readBody } from 'h3'
import {
  assertMediaFormat,
  assertMediaType,
  mapMediaRow,
  sanitizeString,
  toMetadata,
  toPositiveInteger,
} from '../../../utils/adminMedia'
import { getSupabaseContext, normalizeSupabaseError } from '../../../utils/supabaseApi'

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
    if (!mediaType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'mediaType cannot be empty.',
      })
    }

    try {
      updates.media_type = assertMediaType(mediaType)
    } catch (error) {
      const message = error instanceof TypeError ? error.message : 'Invalid mediaType.'
      throw createError({
        statusCode: 400,
        statusMessage: message,
      })
    }
  }
  if ('mediaFormat' in body) {
    const mediaFormat = sanitizeString(body.mediaFormat)
    if (!mediaFormat) {
      throw createError({
        statusCode: 400,
        statusMessage: 'mediaFormat cannot be empty.',
      })
    }

    try {
      updates.media_format = assertMediaFormat(mediaFormat)
    } catch (error) {
      const message = error instanceof TypeError ? error.message : 'Invalid mediaFormat.'
      throw createError({
        statusCode: 400,
        statusMessage: message,
      })
    }
  }
  if ('isbn' in body) updates.isbn = sanitizeString(body.isbn)
  if ('genre' in body) updates.genre = sanitizeString(body.genre)
  if ('subject' in body) updates.subject = sanitizeString(body.subject)
  if ('description' in body) updates.description = sanitizeString(body.description)
  if ('coverUrl' in body) updates.cover_url = sanitizeString(body.coverUrl)
  if ('language' in body) updates.language = sanitizeString(body.language)
  if ('pages' in body) {
    updates.pages = toPositiveInteger(body.pages)
  }
  if ('durationSeconds' in body) {
    updates.duration_seconds = toPositiveInteger(body.durationSeconds)
  }
  if ('publishedAt' in body) updates.published_at = sanitizeString(body.publishedAt)
  if ('metadata' in body) {
    try {
      updates.metadata = toMetadata(body.metadata ?? {}, {})
    } catch (error) {
      const message = error instanceof TypeError ? error.message : 'Invalid metadata payload.'
      throw createError({
        statusCode: 400,
        statusMessage: message,
      })
    }
  }

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
    item: mapMediaRow(data),
  }
})
