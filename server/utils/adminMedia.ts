export const MEDIA_TYPES = ['book', 'video', 'audio', 'other'] as const
export const MEDIA_FORMATS = ['print', 'ebook', 'audiobook', 'dvd', 'blu-ray'] as const

export type MediaType = (typeof MEDIA_TYPES)[number]
export type MediaFormat = (typeof MEDIA_FORMATS)[number]

type Maybe<T> = T | null | undefined

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

export function sanitizeString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return null
}

export function toPositiveInteger(value: Maybe<number>): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value))
  }

  return null
}

export function toMetadata(value: unknown, fallback: Record<string, unknown> = {}): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { ...fallback }
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Metadata must be an object')
  }

  return { ...(value as Record<string, unknown>) }
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

  return { ...(requested as Record<string, unknown>) }
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
