import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseServiceClient } from './supabaseServiceClient'

interface SupabaseSessionResult {
  supabase: SupabaseClient
  user: User
  accessToken: string
}

async function extractAuthHeader(event: H3Event) {
  const authorization = event.node.req.headers.authorization
  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

async function extractAuthCookie(event: H3Event) {
  const cookies = event.node.req.headers.cookie ?? ''
  const sessionCookie = cookies
    .split(';')
    .map((cookie: string) => cookie.trim())
    .find((cookie: string) => cookie.startsWith('sb-access-token='))

  if (!sessionCookie) {
    return null
  }

  return decodeURIComponent(sessionCookie.replace('sb-access-token=', ''))
}

async function extractAuthToken(event: H3Event) {
  return (await extractAuthHeader(event)) ?? (await extractAuthCookie(event))
}

export async function requireSupabaseSession(event: H3Event): Promise<SupabaseSessionResult> {
  const accessToken = await extractAuthToken(event)

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Supabase session missing.',
    })
  }

  const supabase = getSupabaseServiceClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Supabase session invalid.',
    })
  }

  return {
    supabase,
    user,
    accessToken,
  }
}