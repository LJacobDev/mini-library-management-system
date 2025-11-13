import { createError, getQuery } from 'h3'
import { getSupabaseServiceClient } from '../utils/supabaseServiceClient'

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60

function parsePositiveInteger(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value))
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed)) {
      return Math.max(1, parsed)
    }
  }

  return fallback
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parsePositiveInteger(query.page, 1)
  const requestedPageSize = parsePositiveInteger(query.pageSize, DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const type = typeof query.type === 'string' ? query.type.trim().toLowerCase() : ''

  const supabase = getSupabaseServiceClient()
  let builder = supabase
    .from('media')
    .select(
      `id, title, creator, media_type, media_format, cover_url, genre, subject, description, published_at, metadata`,
      { count: 'exact' }
    )
    .order('title', { ascending: true })

  if (type && type !== 'all') {
    builder = builder.eq('media_type', type)
  }

  if (search) {
    const like = `%${search}%`
    builder = builder.or(
      ['title.ilike.', 'creator.ilike.', 'genre.ilike.', 'subject.ilike.']
        .map((column) => `${column}${like}`)
        .join(',')
    )
  }

  const offset = (page - 1) * pageSize
  builder = builder.range(offset, offset + pageSize - 1)

  const { data, error, count } = await builder

  if (error) {
    console.error('Failed to fetch catalog from Supabase', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to load catalog data at this time.',
    })
  }

  const items = (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    author: item.creator,
    mediaType: item.media_type,
    mediaFormat: item.media_format,
    coverUrl: item.cover_url,
    subjects: [item.genre, item.subject].filter(Boolean),
    description: item.description,
    publishedAt: item.published_at,
    metadata: item.metadata ?? {},
  }))

  return {
    page,
    pageSize,
    total: count ?? items.length,
    items,
  }
})
