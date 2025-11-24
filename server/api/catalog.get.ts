import { createError, getQuery } from 'h3'
import { getSupabaseServiceClient } from '../utils/supabaseServiceClient'
import { escapeLikeTerm, quoteFilterValue, sanitizeSearchTerm } from '../../utils/searchFilters'
import { clampPage, clampPageSize } from '../../utils/pagination'

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

type ActiveLoanRow = {
  id: string
  media_id: string
  user_id: string
  due_date: string | null
  returned_at: string | null
  user_snapshot: Record<string, unknown> | null
}

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60
const ALLOWED_MEDIA_TYPES = new Set(['book', 'video', 'audio', 'other'])
const MAX_SEARCH_LENGTH = 300

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = clampPage(query.page, 1)
  const pageSize = clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE, { max: MAX_PAGE_SIZE })
  const search = sanitizeSearchTerm(typeof query.q === 'string' ? query.q : '', { maxLength: MAX_SEARCH_LENGTH })
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

  const mediaRows = ((data ?? []) as unknown as MediaRow[])

  const mediaIds = mediaRows.map((item) => item.id).filter((id): id is string => typeof id === 'string' && !!id)
  const activeLoansByMedia = new Map<string, ActiveLoanRow>()

  if (mediaIds.length) {
    const { data: loanRows, error: loanError } = await supabase
      .from('media_loans')
      .select('id, media_id, user_id, due_date, returned_at, user_snapshot')
      .in('media_id', mediaIds)
      .is('returned_at', null)

    if (loanError) {
      console.error('Failed to fetch active loan data for catalog items', loanError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Unable to load catalog loan data at this time.',
      })
    }

    for (const loan of loanRows ?? []) {
      if (loan?.media_id) {
        activeLoansByMedia.set(loan.media_id, loan as ActiveLoanRow)
      }
    }
  }

  const items = mediaRows.map((item) => {
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

    const activeLoan = activeLoansByMedia.get(item.id)
    if (activeLoan) {
      assignMetadata('loanStatus', 'checked_out')
      assignMetadata('loanId', activeLoan.id)

      if (typeof activeLoan.due_date === 'string' && activeLoan.due_date.trim()) {
        assignMetadata('dueDate', activeLoan.due_date)
      }

      const borrowerSnapshot = (activeLoan.user_snapshot ?? {}) as Record<string, unknown>
      const borrower: {
        id?: string
        email?: string
        name?: string
      } = {}

      if (typeof activeLoan.user_id === 'string' && activeLoan.user_id) {
        borrower.id = activeLoan.user_id
      }

      if (typeof borrowerSnapshot.email === 'string' && borrowerSnapshot.email.trim()) {
        borrower.email = borrowerSnapshot.email.trim()
      }

      if (typeof borrowerSnapshot.name === 'string' && borrowerSnapshot.name.trim()) {
        borrower.name = borrowerSnapshot.name.trim()
      }

      if (borrower.id || borrower.email || borrower.name) {
        assignMetadata('borrower', borrower)
      }
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
