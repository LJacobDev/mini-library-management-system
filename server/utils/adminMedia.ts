export const MEDIA_TYPES = ['book', 'video', 'audio', 'other'] as const
export const MEDIA_FORMATS = ['print', 'ebook', 'audiobook', 'dvd', 'blu-ray'] as const

export type MediaType = (typeof MEDIA_TYPES)[number]
export type MediaFormat = (typeof MEDIA_FORMATS)[number]

type Maybe<T> = T | null | undefined

const DEFAULT_MAX_STRING_LENGTH = 500
const URL_MAX_LENGTH = 1024
const METADATA_KEY_PATTERN = /^[A-Za-z0-9._-]{1,64}$/
const MAX_METADATA_DEPTH = 3

export interface MediaRow {
  id: string
  title: string
  creator: string
  media_type: MediaType
  media_format: MediaFormat
  isbn: string | null
  genre: string | null
  subject: string | null
  description: string | null
  cover_url: string | null
  language: string | null
  pages: number | null
  duration_seconds: number | null
  published_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AdminMediaItem {
  id: string
  title: string
  author: string
  mediaType: MediaType
  mediaFormat: MediaFormat
  isbn: string | null
  genre: string | null
  subject: string | null
  description: string | null
  coverUrl: string | null
  language: string | null
  pages: number | null
  durationSeconds: number | null
  publishedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

function stripControlCharacters(value: string) {
  let result = ''
  for (const char of value) {
    const code = char.charCodeAt(0)
    if ((code >= 0 && code <= 31) || code === 127) {
      result += ' '
    } else {
      result += char
    }
  }
  return result
}

export function sanitizeString(value: unknown, maxLength = DEFAULT_MAX_STRING_LENGTH): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = stripControlCharacters(value.normalize('NFKC'))
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return null
  }

  return normalized.slice(0, maxLength)
}

export function toPositiveInteger(value: Maybe<number>): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value))
  }

  return null
}

export function mapMediaRow(row: MediaRow): AdminMediaItem {
  return {
    id: row.id,
    title: row.title,
    author: row.creator,
    mediaType: row.media_type,
    mediaFormat: row.media_format,
    isbn: row.isbn,
    genre: row.genre,
    subject: row.subject,
    description: row.description,
    coverUrl: row.cover_url,
    language: row.language,
    pages: row.pages,
    durationSeconds: row.duration_seconds,
    publishedAt: row.published_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function sanitizeMetadataObject(value: Record<string, unknown>, depth: number): Record<string, unknown> {
  if (depth > MAX_METADATA_DEPTH) {
    throw new TypeError('Metadata nesting is too deep')
  }

  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!METADATA_KEY_PATTERN.test(key)) {
      throw new TypeError(`Invalid metadata key: ${key}`)
    }

    const sanitized = sanitizeMetadataValue(entry, depth + 1)
    if (sanitized !== undefined) {
      result[key] = sanitized
    }
  }

  return result
}

function sanitizeMetadataValue(value: unknown, depth: number): unknown {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value === 'string') {
    return sanitizeString(value) ?? null
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Metadata numbers must be finite')
    }
    return value
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      throw new TypeError('Metadata arrays are not supported')
    }
    return sanitizeMetadataObject(value as Record<string, unknown>, depth + 1)
  }

  throw new TypeError('Unsupported metadata value type')
}

export function sanitizeMetadata(value: unknown, fallback: Record<string, unknown> = {}): Record<string, unknown> {
  if (value === undefined) {
    return sanitizeMetadataObject(fallback, 0)
  }

  if (value === null) {
    return {}
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Metadata must be an object')
  }

  return sanitizeMetadataObject(value as Record<string, unknown>, 0)
}

export function toMetadata(value: unknown, fallback: Record<string, unknown> = {}): Record<string, unknown> {
  return sanitizeMetadata(value, fallback)
}

export function applyMetadataUpdate(
  current: Maybe<Record<string, unknown>>,
  requested: unknown,
): Record<string, unknown> {
  if (requested === undefined) {
    return current ?? {}
  }

  if (requested === null) {
    return {}
  }

  if (typeof requested !== 'object' || Array.isArray(requested)) {
    throw new TypeError('Metadata must be an object')
  }

  return sanitizeMetadataObject(requested as Record<string, unknown>, 0)
}

export function assertMediaType(value: Maybe<string>) {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!(MEDIA_TYPES as readonly string[]).includes(normalized)) {
    throw new TypeError(`Invalid mediaType. Expected one of: ${MEDIA_TYPES.join(', ')}.`)
  }

  return normalized as MediaType
}

export function assertMediaFormat(value: Maybe<string>) {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!(MEDIA_FORMATS as readonly string[]).includes(normalized)) {
    throw new TypeError(`Invalid mediaFormat. Expected one of: ${MEDIA_FORMATS.join(', ')}.`)
  }

  return normalized as MediaFormat
}

export function sanitizeUrl(value: unknown): string | null {
  const normalized = sanitizeString(value, URL_MAX_LENGTH)
  if (!normalized) {
    return null
  }

  try {
    const url = new URL(normalized)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new TypeError('Only http and https URLs are allowed')
    }
    return url.toString()
  } catch {
    throw new TypeError('Invalid URL value')
  }
}

export function sanitizeIsoDate(value: unknown): string | null {
  const normalized = sanitizeString(value, 64)
  if (!normalized) {
    return null
  }

  const timestamp = Date.parse(normalized)
  if (Number.isNaN(timestamp)) {
    throw new TypeError('Invalid date value')
  }

  return new Date(timestamp).toISOString()
}
