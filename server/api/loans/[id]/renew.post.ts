import { createError, getRouterParam, readBody } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../../../utils/supabaseApi'
import { assertUuid } from '../../../utils/validators'

interface RenewPayload {
  dueDate?: string
  note?: string
}

const RESERVATION_BLOCK_STATUSES = ['pending', 'waiting', 'ready_for_pickup'] as const
const NOTE_MAX_LENGTH = 500
const MAX_DUE_DATE_DAYS_AHEAD = 365
const MAX_PAST_DUE_DATE_MINUTES = 60
function stripControlCharacters(input: string) {
  let result = ''
  for (const char of input) {
    const code = char.charCodeAt(0)
    if ((code >= 0 && code <= 31) || code === 127) {
      result += ' '
    } else {
      result += char
    }
  }
  return result
}

function sanitizeNote(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = stripControlCharacters(value.normalize('NFKC'))
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return undefined
  }

  return normalized.slice(0, NOTE_MAX_LENGTH)
}

function normalizeRenewDueDate(value: unknown) {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'dueDate must be an ISO date string.',
    })
  }

  const trimmed = value.trim()
  if (!trimmed) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dueDate is required for renewal.',
    })
  }

  const timestamp = Date.parse(trimmed)
  if (Number.isNaN(timestamp)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dueDate must be a valid date.',
    })
  }

  const now = Date.now()
  const minAllowed = now - MAX_PAST_DUE_DATE_MINUTES * 60 * 1000
  const maxAllowed = now + MAX_DUE_DATE_DAYS_AHEAD * 24 * 60 * 60 * 1000

  if (timestamp < minAllowed) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dueDate cannot be earlier than the current time.',
    })
  }

  if (timestamp > maxAllowed) {
    throw createError({
      statusCode: 400,
      statusMessage: `dueDate cannot be more than ${MAX_DUE_DATE_DAYS_AHEAD} days in the future.`,
    })
  }

  return new Date(timestamp).toISOString()
}

export default defineEventHandler(async (event) => {
  const loanId = assertUuid(getRouterParam(event, 'id'), 'Loan ID')

  const { supabase, user, role } = await getSupabaseContext(event, { roles: ['member', 'librarian', 'admin'] })
  const body = (await readBody<RenewPayload>(event)) ?? {}

  const allowedKeys: Array<keyof RenewPayload> = ['dueDate', 'note']
  const unexpectedKeys = Object.keys(body).filter((key) => !allowedKeys.includes(key as keyof RenewPayload))
  if (unexpectedKeys.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported field(s): ${unexpectedKeys.join(', ')}`,
    })
  }

  if (body.dueDate === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A dueDate value is required for renewal.',
    })
  }

  const normalizedDueDate = normalizeRenewDueDate(body.dueDate)
  const sanitizedNote = sanitizeNote(body.note)

  const { data: loan, error: loanError } = await supabase
    .from('media_loans')
    .select('*')
    .eq('id', loanId)
    .maybeSingle()

  if (loanError) {
    throw normalizeSupabaseError(loanError, 'Unable to load loan record.')
  }

  if (!loan) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Loan not found.',
    })
  }

  if (loan.returned_at) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Loan already returned; cannot renew.',
    })
  }

  const isBorrower = loan.user_id === user.id
  const isStaff = role === 'librarian' || role === 'admin'

  if (!isStaff && !isBorrower) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to renew this loan.',
    })
  }

  const { data: pendingReservations, error: reservationsError } = await supabase
    .from('media_reservations')
    .select('id')
    .eq('media_id', loan.media_id)
    .in('status', RESERVATION_BLOCK_STATUSES)

  if (reservationsError) {
    throw normalizeSupabaseError(reservationsError, 'Unable to check reservation queue.')
  }

  if ((pendingReservations ?? []).length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cannot renew: reservation queue exists for this item.',
    })
  }

  const updatePayload: Record<string, unknown> = {
    due_date: normalizedDueDate,
    note: sanitizedNote ?? loan.note,
  }

  if (isStaff) {
    updatePayload.processed_by = user.id
  }

  const { data: updatedLoan, error: updateError } = await supabase
    .from('media_loans')
    .update(updatePayload)
    .eq('id', loanId)
    .select('*')
    .single()

  if (updateError || !updatedLoan) {
    throw normalizeSupabaseError(updateError, 'Unable to renew loan.')
  }

  await supabase
    .from('loan_events')
    .insert({
      loan_id: loanId,
      event_type: 'renewed',
      actor_id: user.id,
      notes: sanitizedNote ?? undefined,
      payload: {
        previousDueDate: loan.due_date,
        newDueDate: updatedLoan.due_date,
      },
    })

  return {
    loan: {
      id: updatedLoan.id,
      mediaId: updatedLoan.media_id,
      memberId: updatedLoan.user_id,
      checkedOutAt: updatedLoan.checked_out_at,
      dueDate: updatedLoan.due_date,
      returnedAt: updatedLoan.returned_at,
      note: updatedLoan.note,
      processedBy: updatedLoan.processed_by,
      createdAt: updatedLoan.created_at,
      updatedAt: updatedLoan.updated_at,
    },
  }
})
