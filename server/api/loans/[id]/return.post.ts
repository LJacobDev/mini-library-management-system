import { createError, getRouterParam, readBody } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../../../utils/supabaseApi'

interface ReturnPayload {
  condition?: string
  notes?: string
}

export default defineEventHandler(async (event) => {
  const loanId = getRouterParam(event, 'id')
  if (!loanId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing loan ID.',
    })
  }

  const { supabase, user } = await getSupabaseContext(event, { roles: ['librarian', 'admin'] })
  const body = (await readBody<ReturnPayload>(event)) ?? {}

  const condition = typeof body.condition === 'string' && body.condition.trim().length ? body.condition.trim() : null
  const notes = typeof body.notes === 'string' && body.notes.trim().length ? body.notes.trim() : null

  const { data: existingLoan, error: fetchError } = await supabase
    .from('media_loans')
    .select('*')
    .eq('id', loanId)
    .maybeSingle()

  if (fetchError) {
    throw normalizeSupabaseError(fetchError, 'Unable to load loan record.')
  }

  if (!existingLoan) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Loan not found.',
    })
  }

  if (existingLoan.returned_at) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Loan already returned.',
    })
  }

  const updatePayload = {
    returned_at: new Date().toISOString(),
    note: notes ?? existingLoan.note,
    processed_by: user.id,
  }

  const { data: updatedLoan, error } = await supabase
    .from('media_loans')
    .update(updatePayload)
    .eq('id', loanId)
    .select('*')
    .single()

  if (error || !updatedLoan) {
    throw normalizeSupabaseError(error, 'Unable to complete loan return.')
  }

  if (condition) {
    await supabase
      .from('loan_events')
      .insert({
        loan_id: loanId,
        event_type: 'returned',
        notes: condition,
        actor_id: user.id,
      })
  }

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
