import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { PostgrestError, User } from '@supabase/supabase-js'
import { requireSupabaseSession, type SupabaseSessionResult } from './requireSupabaseSession'

export type AppRole = 'member' | 'librarian' | 'admin'

const VALID_ROLES: ReadonlyArray<AppRole> = ['member', 'librarian', 'admin'] as const

function resolveUserRole(user: User): AppRole {
  const rawRole = (user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined
  if (rawRole && VALID_ROLES.includes(rawRole as AppRole)) {
    return rawRole as AppRole
  }

  return 'member'
}

export interface SupabaseApiContext extends SupabaseSessionResult {
  role: AppRole
}

interface RequireSessionOptions {
  roles?: AppRole[]
  forbiddenMessage?: string
}

export async function getSupabaseContext(event: H3Event, options: RequireSessionOptions = {}): Promise<SupabaseApiContext> {
  const session = await requireSupabaseSession(event)
  const role = resolveUserRole(session.user)

  if (options.roles?.length && !options.roles.includes(role)) {
    const required = options.roles.join(', ')
    throw createError({
      statusCode: 403,
      statusMessage: options.forbiddenMessage ?? `Forbidden: ${required} role required.`,
    })
  }

  return {
    ...session,
    role,
  }
}

interface SupabaseResult<T> {
  data: T
  error: PostgrestError | null
}

export function ensureSupabaseResult<T>(result: SupabaseResult<T>, fallbackMessage: string, statusCode = 500): T {
  if (result.error) {
    console.error('[Supabase] request failed', result.error)
    throw createError({
      statusCode,
      statusMessage: fallbackMessage,
    })
  }

  return result.data
}

export function normalizeSupabaseError(
  error: PostgrestError | Error | null | undefined,
  fallbackMessage: string,
  statusCode = 500
) {
  if (!error) {
    return createError({
      statusCode,
      statusMessage: fallbackMessage,
    })
  }

  const details = 'code' in error ? `${error.code}: ${error.message}` : error.message
  console.error('[Supabase] error', details, error)

  return createError({
    statusCode,
    statusMessage: fallbackMessage,
  })
}
