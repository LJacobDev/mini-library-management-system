import { createError } from 'h3'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/
const IDENTIFIER_PATTERN = /^[A-Za-z0-9@._-]{3,120}$/

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim())
}

export function assertUuid(value: unknown, fieldName = 'id'): string {
  if (!isUuid(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} must be a valid UUID string.`,
    })
  }

  return (value as string).trim()
}

export function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    return undefined
  }

  return normalized
}

export function isEmail(value: unknown): value is string {
  return Boolean(normalizeEmail(value))
}

export function assertEmail(value: unknown, fieldName = 'email'): string {
  const normalized = normalizeEmail(value)
  if (!normalized) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} must be a valid email address.`,
    })
  }

  return normalized
}

export function sanitizeIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const compact = trimmed.replace(/[^A-Za-z0-9@._-]/g, '')
  if (!compact || !IDENTIFIER_PATTERN.test(compact)) {
    return undefined
  }

  return compact
}
