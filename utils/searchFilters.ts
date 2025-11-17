import { normalizeWhitespace, stripControlChars } from './sanitizeText'

const DEFAULT_SAFE_PATTERN = /[^\p{L}\p{N}\p{M}\s'",.!?\-_/]/gu

interface SanitizeSearchOptions {
  maxLength?: number
  unsafePattern?: RegExp
}

export function stripUnsafeSearchCharacters(value: string, pattern: RegExp = DEFAULT_SAFE_PATTERN) {
  return value.replace(pattern, ' ')
}

export function sanitizeSearchTerm(value: string | null | undefined, options: SanitizeSearchOptions = {}): string {
  const { maxLength = 300, unsafePattern = DEFAULT_SAFE_PATTERN } = options

  if (!value) {
    return ''
  }

  const cleaned = stripUnsafeSearchCharacters(stripControlChars(value.normalize('NFKC')), unsafePattern)
  const normalized = normalizeWhitespace(cleaned)

  if (!normalized) {
    return ''
  }

  return normalized.slice(0, maxLength)
}

export function escapeLikeTerm(term: string) {
  if (!term) {
    return term
  }

  return term.replace(/([%_\\])/g, '\\$1')
}

export function quoteFilterValue(value: string) {
  const escapedQuotes = value.replace(/"/g, '\\"')
  return `"${escapedQuotes}"`
}

export function buildIlikeFilters(columns: string[], likePattern: string) {
  return columns.map((column) => `${column}.ilike.${likePattern}`).join(',')
}
