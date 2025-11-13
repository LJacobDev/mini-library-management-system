import { createError, getQuery } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../utils/supabaseApi'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const VALID_STATUS = new Set(['active', 'returned', 'overdue'])

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
  const { supabase } = await getSupabaseContext(event, { roles: ['librarian', 'admin'] })

  const query = getQuery(event)
  const memberId = typeof query.memberId === 'string' && query.memberId.trim().length ? query.memberId.trim() : null
  const rawStatus = typeof query.status === 'string' ? query.status.trim().toLowerCase() : ''
  const statusFilter = rawStatus ? rawStatus : null

  if (statusFilter && !VALID_STATUS.has(statusFilter)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid status filter. Expected one of: ${Array.from(VALID_STATUS).join(', ')}.`,
    })
  }

  const page = parsePositiveInteger(query.page, 1)
  const requestedPageSize = parsePositiveInteger(query.pageSize ?? query.limit, DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)

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
