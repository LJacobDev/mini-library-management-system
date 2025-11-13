import { createError, getRouterParam, readBody } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../../../utils/supabaseApi'

interface RenewPayload {
  dueDate?: string
  note?: string
}

const RESERVATION_BLOCK_STATUSES = ['pending', 'waiting', 'ready_for_pickup'] as const

function isIsoDate(value: unknown) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

export default defineEventHandler(async (event) => {
  const loanId = getRouterParam(event, 'id')
  if (!loanId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing loan ID.',
    })
  }

  const { supabase, user, role } = await getSupabaseContext(event, { roles: ['member', 'librarian', 'admin'] })
  const body = (await readBody<RenewPayload>(event)) ?? {}

  if (!isIsoDate(body.dueDate)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid dueDate ISO string is required for renewal.',
    })
  }

  const note = typeof body.note === 'string' && body.note.trim().length ? body.note.trim() : null

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
    due_date: new Date(body.dueDate!).toISOString(),
    note: note ?? loan.note,
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
      notes: note ?? undefined,
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
