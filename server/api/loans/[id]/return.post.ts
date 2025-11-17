import { createError, getRouterParam, readBody } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../../../utils/supabaseApi'

interface ReturnPayload {
  condition?: string
  notes?: string
}

const NOTE_MAX_LENGTH = 500
const CONDITION_MAX_LENGTH = 300
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: unknown) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

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

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = stripControlCharacters(value.normalize('NFKC'))
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return undefined
  }

  return normalized.slice(0, maxLength)
}

export default defineEventHandler(async (event) => {
  const loanId = getRouterParam(event, 'id')
  if (!loanId || !isUuid(loanId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Loan ID must be a valid UUID.',
    })
  }

  const { supabase, user } = await getSupabaseContext(event, { roles: ['librarian', 'admin'] })
  const body = (await readBody<ReturnPayload>(event)) ?? {}

  const allowedKeys: Array<keyof ReturnPayload> = ['condition', 'notes']
  const unexpectedKeys = Object.keys(body).filter((key) => !allowedKeys.includes(key as keyof ReturnPayload))
  if (unexpectedKeys.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported field(s): ${unexpectedKeys.join(', ')}`,
    })
  }

  const condition = sanitizeText(body.condition, CONDITION_MAX_LENGTH)
  const notes = sanitizeText(body.notes, NOTE_MAX_LENGTH)

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
