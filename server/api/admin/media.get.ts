import { createError, getQuery } from 'h3'
import { mapMediaRow, MEDIA_TYPES, type MediaRow } from '../../utils/adminMedia'
import { getSupabaseContext, normalizeSupabaseError } from '../../utils/supabaseApi'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const MAX_SEARCH_LENGTH = 300
const SAFE_SEARCH_PATTERN = /[^\p{L}\p{N}\p{M}\s'",.!?\-_/]/gu
const SEARCHABLE_COLUMNS = ['title', 'creator', 'genre', 'subject', 'isbn']
const ALLOWED_SORTS = ['title', 'created_at', 'updated_at'] as const
const UUID_SORT_DEFAULT = 'title'

function stripUnsafeSearchCharacters(value: string) {
  return value.replace(SAFE_SEARCH_PATTERN, ' ')
}

function stripControlCharacters(value: string) {
  let result = ''
  for (const char of value) {
    const code = char.charCodeAt(0)
    if ((code >= 0 && code <= 31) || code === 127) {
      result += ' '
    } else {
      result += char
    }
  }
  return result
}

function sanitizeSearchTerm(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const normalized = stripControlCharacters(stripUnsafeSearchCharacters(value.normalize('NFKC')))
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return ''
  }

  return normalized.slice(0, MAX_SEARCH_LENGTH)
}

function escapeLikeTerm(term: string) {
  if (!term) {
    return term
  }

  return term.replace(/([%_\\])/g, '\\$1')
}

function quoteFilterValue(value: string) {
  const escapedQuotes = value.replace(/"/g, '\\"')
  return `"${escapedQuotes}"`
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  if (Array.isArray(value) && value.length) {
    return parsePositiveInteger(value[0], fallback)
  }

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

function getQueryString(value: unknown) {
  if (Array.isArray(value) && value.length) {
    const first = value.find((entry): entry is string => typeof entry === 'string')
    return first ?? null
  }

  return typeof value === 'string' ? value : null
}

export default defineEventHandler(async (event) => {
  const { supabase } = await getSupabaseContext(event, { roles: ['admin'] })

  const query = getQuery(event) as Record<string, string | string[] | undefined>
  const page = parsePositiveInteger(query.page, 1)
  const requestedPageSize = parsePositiveInteger(query.pageSize ?? query.limit, DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const search = sanitizeSearchTerm(getQueryString(query.q))
  const mediaTypeCandidate = getQueryString(query.mediaType)?.trim().toLowerCase() ?? ''
  const mediaType = MEDIA_TYPES.includes(mediaTypeCandidate as (typeof MEDIA_TYPES)[number])
    ? mediaTypeCandidate
    : ''
  const sortCandidate = getQueryString(query.sort)?.trim() ?? UUID_SORT_DEFAULT
  const directionCandidate = (getQueryString(query.direction)?.trim().toLowerCase() ?? 'asc') as 'asc' | 'desc'

  const orderColumn = (ALLOWED_SORTS as readonly string[]).includes(sortCandidate) ? sortCandidate : UUID_SORT_DEFAULT
  const orderDirection = directionCandidate === 'desc' ? { ascending: false } : { ascending: true }

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
    const escaped = escapeLikeTerm(search)
    const like = quoteFilterValue(`%${escaped}%`)
    const orFilters = SEARCHABLE_COLUMNS.map((column) => `${column}.ilike.${like}`).join(',')
    builder = builder.or(orFilters)
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
