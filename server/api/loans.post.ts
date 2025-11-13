import { createError, readBody } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../utils/supabaseApi'

interface CheckoutPayload {
  memberId?: string
  mediaId?: string
  dueDate?: string
  note?: string
}

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value)
}

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getSupabaseContext(event, { roles: ['librarian', 'admin'] })
  const body = (await readBody<CheckoutPayload>(event)) ?? {}

  if (!isUuid(body.memberId) || !isUuid(body.mediaId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'memberId and mediaId must be valid UUID strings.',
    })
  }

  const processedBy = user.id

  const dueDateISO = body.dueDate && !Number.isNaN(Date.parse(body.dueDate)) ? new Date(body.dueDate).toISOString() : null
  const note = typeof body.note === 'string' && body.note.trim().length ? body.note.trim() : null

  const now = new Date().toISOString()

  const { data: existingLoan, error: existingLoanError } = await supabase
    .from('media_loans')
    .select('id')
    .eq('media_id', body.mediaId)
    .is('returned_at', null)
    .maybeSingle()

  if (existingLoanError) {
    throw normalizeSupabaseError(existingLoanError, 'Unable to check existing loan state.')
  }

  if (existingLoan) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Media already checked out to another member.',
    })
  }

  const { data: loan, error } = await supabase
    .from('media_loans')
    .insert({
      media_id: body.mediaId,
      user_id: body.memberId,
      due_date: dueDateISO,
      note,
      processed_by: processedBy,
      checked_out_at: now,
    })
    .select('*')
    .single()

  if (error || !loan) {
    throw normalizeSupabaseError(error, 'Unable to checkout media item.')
  }

  return {
    loan: {
      id: loan.id,
      mediaId: loan.media_id,
      memberId: loan.user_id,
      checkedOutAt: loan.checked_out_at,
      dueDate: loan.due_date,
      returnedAt: loan.returned_at,
      note: loan.note,
      processedBy: loan.processed_by,
      createdAt: loan.created_at,
      updatedAt: loan.updated_at,
    },
  }
})
