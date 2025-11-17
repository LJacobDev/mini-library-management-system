import { createError, getQuery } from 'h3'
import { getSupabaseServiceClient } from '../utils/supabaseServiceClient'

type MediaRow = {
  id: string
  title: string
  creator: string
  media_type: string
  media_format: string | null
  cover_url: string | null
  genre: string | null
  subject: string | null
  description: string | null
  published_at: string | null
  isbn: string | null
  language: string | null
  pages: number | null
  duration_seconds: number | null
  metadata: Record<string, unknown> | null
}

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60
const ALLOWED_MEDIA_TYPES = new Set(['book', 'video', 'audio', 'other'])
const MAX_SEARCH_LENGTH = 300

const SAFE_SEARCH_PATTERN = /[^\p{L}\p{N}\p{M}\s'",.!?\-_/]/gu

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

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parsePositiveInteger(query.page, 1)
  const requestedPageSize = parsePositiveInteger(query.pageSize, DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const search = sanitizeSearchTerm(typeof query.q === 'string' ? query.q : '')
  const rawType = typeof query.type === 'string' ? query.type.trim().toLowerCase() : ''
  const type = ALLOWED_MEDIA_TYPES.has(rawType) ? rawType : ''

  const supabase = getSupabaseServiceClient()
  let builder = supabase
    .from('media')
    .select(
      [
        'id',
        'title',
        'creator',
        'media_type',
        'media_format',
        'cover_url',
        'genre',
        'subject',
        'description',
        'published_at',
        'isbn',
        'language',
        'pages',
        'duration_seconds',
        'metadata',
      ].join(', '),
      { count: 'exact' }
    )
    .order('title', { ascending: true })

  if (type && type !== 'all') {
    builder = builder.eq('media_type', type)
  }

  if (search) {
    const escaped = escapeLikeTerm(search)
    const like = quoteFilterValue(`%${escaped}%`)
    const searchableColumns = ['title', 'creator', 'genre', 'subject']
    const orFilters = searchableColumns.map((column) => `${column}.ilike.${like}`).join(',')
    builder = builder.or(orFilters)
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

  const items = ((data ?? []) as unknown as MediaRow[]).map((item) => {
    const metadata: Record<string, unknown> = {}

    if (item.metadata && typeof item.metadata === 'object') {
      Object.assign(metadata, item.metadata)
    }

    const assignMetadata = (key: string, value: unknown) => {
      if (value === null || value === undefined) {
        return
      }

      if (typeof value === 'string' && !value.trim()) {
        return
      }

      metadata[key] = value
    }

    assignMetadata('isbn', item.isbn)
    assignMetadata('language', item.language)
    assignMetadata('pages', item.pages)

    if (typeof item.duration_seconds === 'number' && Number.isFinite(item.duration_seconds)) {
      const minutes = Math.max(1, Math.round(item.duration_seconds / 60))
      assignMetadata('duration_minutes', minutes)
    }

    return {
      id: item.id,
      title: item.title,
      author: item.creator,
      mediaType: item.media_type,
      mediaFormat: item.media_format,
      coverUrl: item.cover_url,
      subjects: [item.genre, item.subject].filter(Boolean),
      description: item.description,
      publishedAt: item.published_at,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    }
  })

  const total = count ?? items.length
  const hasMore = total > page * pageSize
  const nextPage = hasMore ? page + 1 : null
  const nextCursor = hasMore ? items.at(-1)?.id ?? null : null

  return {
    page,
    pageSize,
    total,
    hasMore,
    nextPage,
    nextCursor,
    items,
  }
})
