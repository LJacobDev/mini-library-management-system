import { createError, readBody } from 'h3'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseContext, normalizeSupabaseError, type AppRole } from '../utils/supabaseApi'

interface CheckoutPayload {
  memberId?: string
  memberEmail?: string
  memberIdentifier?: string
  mediaId?: string
  dueDate?: string
  note?: string
}

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value)
}

function isEmail(value: unknown) {
  return typeof value === 'string' && /.+@.+\..+/.test(value)
}

function resolveRoleFromAuthUser(user: User): AppRole {
  const role = (user.app_metadata?.role ?? user.user_metadata?.role) as AppRole | undefined
  return role && ['member', 'librarian', 'admin'].includes(role) ? role : 'member'
}

async function ensureProfileRecord(
  supabase: SupabaseClient,
  userId: string,
  role: AppRole,
  displayName: string | null,
) {
  const { error: profileFetchError, data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileFetchError) {
    throw normalizeSupabaseError(profileFetchError, 'Unable to verify profile record.')
  }

  if (existingProfile) {
    return
  }

  const { error: profileInsertError } = await supabase.from('profiles').insert({
    user_id: userId,
    display_name: displayName ?? null,
    role,
  })

  if (profileInsertError) {
    throw normalizeSupabaseError(profileInsertError, 'Unable to create member profile record.')
  }
}

async function ensureUserRecord(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  role: AppRole,
) {
  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle()

  if (existingUserError) {
    throw normalizeSupabaseError(existingUserError, 'Unable to verify member record.')
  }

  if (existingUser) {
    if (email && existingUser.email !== email) {
      await supabase
        .from('users')
        .update({ email })
        .eq('id', userId)
    }

    await ensureProfileRecord(supabase, userId, role, email)
    return existingUser
  }

  const insertPayload = {
    id: userId,
    email: email ?? `${userId}@mlms.local`,
    role,
  }

  const { data: insertedUser, error: insertError } = await supabase
    .from('users')
    .insert(insertPayload)
    .select('id, email')
    .single()

  if (insertError || !insertedUser) {
    throw normalizeSupabaseError(insertError, 'Unable to provision member record.')
  }

  await ensureProfileRecord(supabase, insertedUser.id, role, email)
  return insertedUser
}

async function resolveMemberById(
  supabase: SupabaseClient,
  memberId: string,
) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', memberId)
    .maybeSingle()

  if (existingUser) {
    await ensureProfileRecord(supabase, existingUser.id, (existingUser.role as AppRole) ?? 'member', existingUser.email)
    return existingUser
  }

  const { data: authLookup, error: authError } = await supabase.auth.admin.getUserById(memberId)

  if (authError || !authLookup?.user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Member not found for the supplied ID.',
    })
  }

  const role = resolveRoleFromAuthUser(authLookup.user)
  return ensureUserRecord(supabase, authLookup.user.id, authLookup.user.email ?? null, role)
}

async function resolveMemberByEmail(
  supabase: SupabaseClient,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase()
  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id, email, role')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (existingUserError) {
    throw normalizeSupabaseError(existingUserError, 'Unable to verify member email.')
  }

  if (existingUser) {
    await ensureProfileRecord(supabase, existingUser.id, (existingUser.role as AppRole) ?? 'member', existingUser.email)
    return existingUser
  }

  const { data: listResult, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })

  if (listError) {
    throw normalizeSupabaseError(listError, 'Unable to search Supabase auth users.')
  }

  const authUser = listResult?.users?.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail)

  if (!authUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Member not found for the supplied email.',
    })
  }

  const role = resolveRoleFromAuthUser(authUser)
  const displayName = (authUser.user_metadata?.full_name as string | undefined) ?? authUser.email ?? null

  const ensured = await ensureUserRecord(supabase, authUser.id, authUser.email ?? null, role)
  await ensureProfileRecord(supabase, ensured.id, role, displayName)
  return ensured
}

async function resolveMember(
  supabase: SupabaseClient,
  payload: CheckoutPayload,
) {
  const identifier = payload.memberIdentifier?.trim()
  const candidateId = payload.memberId ?? (identifier && isUuid(identifier) ? identifier : undefined)

  if (candidateId && isUuid(candidateId)) {
    return resolveMemberById(supabase, candidateId)
  }

  const candidateEmail = payload.memberEmail ?? (identifier && isEmail(identifier) ? identifier : undefined)

  if (candidateEmail) {
    return resolveMemberByEmail(supabase, candidateEmail)
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Provide a valid member email address or UUID.',
  })
}

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getSupabaseContext(event, { roles: ['librarian', 'admin'] })
  const body = (await readBody<CheckoutPayload>(event)) ?? {}

  if (!isUuid(body.mediaId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'mediaId must be a valid UUID string.',
    })
  }

  const member = await resolveMember(supabase, body)

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
      user_id: member.id,
      user_snapshot: {
        email: member.email ?? null,
      },
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
