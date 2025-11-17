import { normalizeWhitespace, sanitizeFreeform, stripControlChars } from '../../utils/sanitizeText'

const DEFAULT_SEARCH_LENGTH = 300
const DEFAULT_NOTE_LENGTH = 500
const DEFAULT_TEXT_LENGTH = 500

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/
const IDENTIFIER_PATTERN = /^[A-Za-z0-9@._-]{3,120}$/
const DIGITS_ONLY_PATTERN = /^\d+$/

export { normalizeWhitespace, stripControlChars, sanitizeFreeform }

export function normalizeClientText(value: string, options: { maxLength?: number } = {}) {
  const maxLength = options.maxLength ?? DEFAULT_TEXT_LENGTH
  const normalized = sanitizeFreeform(value, { maxLength, allowEmpty: true })
  return normalized ?? ''
}

export function sanitizeClientSearchInput(value: unknown, options: { maxLength?: number } = {}) {
  const maxLength = options.maxLength ?? DEFAULT_SEARCH_LENGTH
  const normalized = sanitizeFreeform(value, { maxLength, allowEmpty: true })
  return normalized && normalized.trim().length ? normalized : undefined
}

export function sanitizeClientNote(value: unknown, options: { maxLength?: number } = {}) {
  const maxLength = options.maxLength ?? DEFAULT_NOTE_LENGTH
  return sanitizeFreeform(value, { maxLength }) ?? undefined
}

export function sanitizePatronIdentifier(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = stripControlChars(value).trim()
  if (!normalized) {
    return null
  }

  if (UUID_PATTERN.test(normalized)) {
    return normalized
  }

  const lowered = normalized.toLowerCase()
  if (EMAIL_PATTERN.test(lowered)) {
    return lowered
  }

  const compact = normalized.replace(/[^A-Za-z0-9@._-]/g, '')
  if (!compact || !IDENTIFIER_PATTERN.test(compact)) {
    return null
  }

  return compact
}

export function sanitizeClientOptionalText(value: string, options: { maxLength?: number } = {}) {
  const normalized = normalizeClientText(value, options).trim()
  return normalized.length ? normalized : null
}

export function sanitizeClientRequiredText(
  value: string,
  label: string,
  errors: string[],
  options: { maxLength?: number } = {},
) {
  const normalized = sanitizeClientOptionalText(value, options)
  if (!normalized) {
    errors.push(`${label} is required.`)
    return null
  }

  return normalized
}

export function sanitizeClientEnumValue(
  value: string,
  label: string,
  errors: string[],
  allowed: Set<string>,
) {
  const normalized = value.trim().toLowerCase()
  if (!allowed.has(normalized)) {
    errors.push(`${label} selection is invalid.`)
    return null
  }

  return normalized
}

export function sanitizeClientOptionalPositiveInteger(
  value: string,
  label: string,
  errors: string[],
  options: { maxValue: number },
) {
  const trimmed = value.trim()
  if (!trimmed.length) {
    return null
  }

  if (!DIGITS_ONLY_PATTERN.test(trimmed)) {
    errors.push(`${label} must contain digits only.`)
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    errors.push(`${label} must be a positive whole number.`)
    return null
  }

  if (parsed > options.maxValue) {
    errors.push(`${label} must be less than ${options.maxValue.toLocaleString()}.`)
    return null
  }

  return parsed
}

export function sanitizeClientOptionalUrl(
  value: string,
  label: string,
  errors: string[],
  options: { maxLength?: number } = {},
) {
  const normalized = sanitizeClientOptionalText(value, { maxLength: options.maxLength })
  if (!normalized) {
    return null
  }

  try {
    const url = new URL(normalized)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Only http/https supported')
    }
    return url.toString()
  } catch {
    errors.push(`${label} must be a valid URL starting with http or https.`)
    return null
  }
}

export function sanitizeClientOptionalDate(
  value: string,
  label: string,
  errors: string[],
  options: { maxLength?: number } = {},
) {
  const normalized = sanitizeClientOptionalText(value, { maxLength: options.maxLength })
  if (!normalized) {
    return null
  }

  const timestamp = Date.parse(normalized)
  if (Number.isNaN(timestamp)) {
    errors.push(`${label} must be a valid date.`)
    return null
  }

  return new Date(timestamp).toISOString()
}
