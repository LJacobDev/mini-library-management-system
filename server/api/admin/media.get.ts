import { createError, getQuery } from 'h3'
import { mapMediaRow, type MediaRow } from '../../utils/adminMedia'
import { getSupabaseContext, normalizeSupabaseError } from '../../utils/supabaseApi'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function parsePositiveInteger(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value))
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isNaN(parsed)) {
      return Math.max(1, parsed)
    }
  }

  return fallback
}

export default defineEventHandler(async (event) => {
  const { supabase } = await getSupabaseContext(event, { roles: ['admin'] })

  const query = getQuery(event)
  const page = parsePositiveInteger(query.page, 1)
  const requestedPageSize = parsePositiveInteger(query.pageSize ?? query.limit, DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const mediaType = typeof query.mediaType === 'string' ? query.mediaType.trim() : ''
  const sort = typeof query.sort === 'string' ? query.sort.trim() : 'title'
  const direction = typeof query.direction === 'string' ? query.direction.trim().toLowerCase() : 'asc'

  const orderColumn = ['title', 'created_at', 'updated_at'].includes(sort) ? sort : 'title'
  const orderDirection = direction === 'desc' ? { ascending: false } : { ascending: true }

  let builder = supabase
    .from('media')
    .select(
      `id, title, creator, media_type, media_format, isbn, genre, subject, description, cover_url, language, pages, duration_seconds, published_at, metadata, created_at, updated_at`,
      { count: 'exact' }
    )
    .order(orderColumn, orderDirection)

  if (mediaType) {
    builder = builder.eq('media_type', mediaType)
  }

  if (search) {
    const like = `%${search}%`
    builder = builder.or(
      ['title.ilike.', 'creator.ilike.', 'genre.ilike.', 'subject.ilike.', 'isbn.ilike.']
        .map((column) => `${column}${like}`)
        .join(',')
    )
  }

  const offset = (page - 1) * pageSize
  builder = builder.range(offset, offset + pageSize - 1)

  const { data, error, count } = await builder

  if (error) {
    throw normalizeSupabaseError(error, 'Unable to load admin catalog data.')
  }

  if (!data) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Admin catalog payload missing.',
    })
  }

  const total = count ?? data.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    page,
    pageSize,
    total,
    totalPages,
    items: (data as MediaRow[]).map((item) => mapMediaRow(item)),
  }
})
