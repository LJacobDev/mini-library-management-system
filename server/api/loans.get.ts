import { createError, getQuery } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../utils/supabaseApi'
import { assertUuid } from '../utils/validators'
import { escapeLikeTerm, quoteFilterValue, sanitizeSearchTerm } from '../../utils/searchFilters'
import { clampPage, clampPageSize } from '../../utils/pagination'

type LoanStatus = 'active' | 'returned' | 'overdue'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const MAX_SEARCH_LENGTH = 300
const VALID_STATUS = new Set<LoanStatus>(['active', 'returned', 'overdue'])
const LOAN_SEARCH_COLUMNS = ['note', 'user_id', 'media_id', 'id']

function getQueryString(value: unknown) {
  if (Array.isArray(value) && value.length) {
    const first = value.find((entry): entry is string => typeof entry === 'string')
    return first ?? null
  }

  return typeof value === 'string' ? value : null
}

function sanitizeUuidParam(value: unknown, fieldName: string) {
  const raw = getQueryString(value)
  if (!raw) {
    return null
  }

  const normalized = raw.trim()
  if (!normalized) {
    return null
  }

  return assertUuid(normalized, fieldName)
}

export default defineEventHandler(async (event) => {
  const { supabase } = await getSupabaseContext(event, { roles: ['librarian', 'admin'] })

  const query = getQuery(event) as Record<string, string | string[] | undefined>
  const memberId = sanitizeUuidParam(query.memberId, 'memberId')
  const statusInput = getQueryString(query.status)?.trim().toLowerCase()
  let statusFilter: LoanStatus | null = null
  if (statusInput) {
    if (!VALID_STATUS.has(statusInput as LoanStatus)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid status filter. Expected one of: ${Array.from(VALID_STATUS).join(', ')}.`,
      })
    }
    statusFilter = statusInput as LoanStatus
  }
  const rawSearch = getQueryString(query.q) ?? getQueryString(query.search)
  const searchFilter = sanitizeSearchTerm(rawSearch, { maxLength: MAX_SEARCH_LENGTH })

  const page = clampPage(query.page, 1)
  const pageSize = clampPageSize(query.pageSize ?? query.limit, DEFAULT_PAGE_SIZE, { max: MAX_PAGE_SIZE })

  let builder = supabase
    .from('media_loans')
    .select(
      `id, media_id, user_id, checked_out_at, due_date, returned_at, note, user_snapshot, processed_by, created_at, updated_at`,
      { count: 'exact' }
    )
    .order('checked_out_at', { ascending: false })

  if (memberId) {
    builder = builder.eq('user_id', memberId)
  }

  if (statusFilter === 'active') {
    builder = builder.is('returned_at', null)
  } else if (statusFilter === 'returned') {
    builder = builder.not('returned_at', 'is', null)
  } else if (statusFilter === 'overdue') {
    builder = builder.is('returned_at', null).lt('due_date', new Date().toISOString())
  }

  if (searchFilter) {
    const escaped = escapeLikeTerm(searchFilter)
    const like = quoteFilterValue(`%${escaped}%`)
    const orFilters = LOAN_SEARCH_COLUMNS.map((column) => `${column}.ilike.${like}`).join(',')
    builder = builder.or(orFilters)
  }

  const offset = (page - 1) * pageSize
  builder = builder.range(offset, offset + pageSize - 1)

  const { data, error, count } = await builder

  if (error) {
    throw normalizeSupabaseError(error, 'Unable to fetch loan records.')
  }

  const items = (data ?? []).map((loan) => {
    const dueDate = loan.due_date ? new Date(loan.due_date) : null
    const returnedAt = loan.returned_at ? new Date(loan.returned_at) : null
    const now = new Date()

    let status: 'active' | 'overdue' | 'returned' = 'active'
    if (returnedAt) {
      status = 'returned'
    } else if (dueDate && dueDate.getTime() < now.getTime()) {
      status = 'overdue'
    }

    return {
      id: loan.id,
      mediaId: loan.media_id,
      memberId: loan.user_id,
      checkedOutAt: loan.checked_out_at,
      dueDate: loan.due_date,
      returnedAt: loan.returned_at,
      status,
      note: loan.note,
      memberSnapshot: loan.user_snapshot ?? null,
      processedBy: loan.processed_by,
      createdAt: loan.created_at,
      updatedAt: loan.updated_at,
    }
  })

  const total = count ?? items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    page,
    pageSize,
    total,
    totalPages,
    items,
  }
})
