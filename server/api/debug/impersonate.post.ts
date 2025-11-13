import { createError, getHeader, getCookie, setCookie, deleteCookie, readBody } from 'h3'
import type { H3Event } from 'h3'

type DemoRole = 'actual' | 'member' | 'librarian' | 'admin'

const VALID_ROLES: DemoRole[] = ['actual', 'member', 'librarian', 'admin']
const IMPERSONATE_COOKIE = 'mlms-dev-role'
const DEV_ALLOWED_ORIGINS_HEADER = 'x-nuxt-devtools-client'

function assertDevEnvironment(event: H3Event) {
  if (import.meta.dev) {
    return
  }

  const isDevClient = Boolean(getHeader(event, DEV_ALLOWED_ORIGINS_HEADER))
  if (!isDevClient) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  }
}

function normalizeRole(input: unknown): DemoRole {
  if (typeof input !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid role payload.',
    })
  }

  const candidate = input.trim().toLowerCase() as DemoRole
  if (!VALID_ROLES.includes(candidate)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Role not supported for impersonation.',
    })
  }

  return candidate
}

export default defineEventHandler(async (event) => {
  assertDevEnvironment(event)

  const body = await readBody<{ role?: DemoRole }>(event)
  const role = normalizeRole(body?.role)

  const existingRole = getCookie(event, IMPERSONATE_COOKIE)

  if (role === 'actual') {
    if (existingRole) {
      deleteCookie(event, IMPERSONATE_COOKIE, {
        path: '/',
      })
    }

    return {
      impersonating: false,
      role: 'actual',
    }
  }

  setCookie(event, IMPERSONATE_COOKIE, role, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  })

  return {
    impersonating: true,
    role,
  }
})
