import { createError } from 'h3'
import { escapeLikeTerm } from '../../utils/searchFilters'
import { normalizeWhitespace, stripControlChars } from '../../utils/sanitizeText'

const DEFAULT_PROMPT_MAX_LENGTH = 800
const DEFAULT_KEYWORD_MAX_ITEMS = 6
const DEFAULT_KEYWORD_MAX_LENGTH = 64
const MIN_PATTERN_LENGTH = 3

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,}\d)/g
const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
const CARD_PATTERN = /\b\d{8,}\b/g

export const AI_PROMPT_STOP_WORDS = new Set(
  [
    'the',
    'and',
    'a',
    'an',
    'of',
    'for',
    'with',
    'about',
    'into',
    'on',
    'in',
    'to',
    'from',
    'by',
    'at',
    'as',
    'is',
    'are',
    'be',
    'this',
    'that',
    'these',
    'those',
    'it',
    'its',
    'their',
    'my',
    'our',
    'your',
    'we',
    'you',
    'they',
    'them',
    'me',
    'i',
    'but',
    'so',
    'if',
    'or',
    'not',
    'no',
    'yes',
    'please',
    'would',
    'like',
    'looking',
    'need',
    'want',
    'maybe',
    'just',
    'can',
    'could',
    'should',
    'any',
  ]
)

function sanitizeFreeformText(value: string) {
  return normalizeWhitespace(stripControlChars(value.normalize('NFKC')))
}

export function redactSensitiveContent(value: string) {
  return value
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(PHONE_PATTERN, '[REDACTED_PHONE]')
    .replace(UUID_PATTERN, '[REDACTED_ID]')
    .replace(CARD_PATTERN, '[REDACTED_NUMBER]')
}

interface SanitizePromptOptions {
  maxLength?: number
  requiredMessage?: string
  redact?: boolean
}

export function sanitizePromptInput(raw: unknown, options: SanitizePromptOptions = {}) {
  const {
    maxLength = DEFAULT_PROMPT_MAX_LENGTH,
    requiredMessage = 'Prompt is required.',
    redact = true,
  } = options

  if (typeof raw !== 'string') {
    throw createError({ statusCode: 400, statusMessage: requiredMessage })
  }

  const sanitized = sanitizeFreeformText(raw)
  if (!sanitized.length) {
    throw createError({ statusCode: 400, statusMessage: requiredMessage })
  }

  const maybeRedacted = redact ? redactSensitiveContent(sanitized) : sanitized
  const trimmed = maybeRedacted.slice(0, maxLength).trim()

  if (!trimmed.length) {
    throw createError({ statusCode: 400, statusMessage: requiredMessage })
  }

  return trimmed
}

interface SanitizeKeywordOptions {
  maxLength?: number
}

export function sanitizeKeywordValue(value: string, options: SanitizeKeywordOptions = {}) {
  const { maxLength = DEFAULT_KEYWORD_MAX_LENGTH } = options
  const normalized = sanitizeFreeformText(value)
  if (!normalized) {
    return ''
  }

  const cleaned = normalized
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) {
    return ''
  }

  return cleaned.slice(0, maxLength)
}

interface SanitizeKeywordListOptions {
  maxItems?: number
  maxLength?: number
}

export function sanitizeKeywordList(values: string[], options: SanitizeKeywordListOptions = {}) {
  const { maxItems = DEFAULT_KEYWORD_MAX_ITEMS, maxLength = DEFAULT_KEYWORD_MAX_LENGTH } = options
  const sanitized: string[] = []

  for (const value of values) {
    if (sanitized.length >= maxItems) {
      break
    }

    const cleaned = sanitizeKeywordValue(value, { maxLength })
    if (cleaned && !sanitized.includes(cleaned)) {
      sanitized.push(cleaned)
    }
  }

  return sanitized
}

function escapeAngleBrackets(value: string) {
  return value.replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
}

export function wrapPromptForModel(prompt: string) {
  return `<user_prompt>\n${escapeAngleBrackets(prompt)}\n</user_prompt>`
}

export function buildWildcardPattern(keyword: string) {
  if (!keyword) {
    return ''
  }

  const safe = escapeLikeTerm(keyword)
  return `%${safe.replace(/\s+/g, '%')}%`
}

interface BuildSearchPatternsOptions {
  minPatternLength?: number
}

export function buildSearchPatterns(keywords: string[], options: BuildSearchPatternsOptions = {}) {
  const { minPatternLength = MIN_PATTERN_LENGTH } = options

  return keywords
    .map((keyword) => buildWildcardPattern(keyword))
    .filter((pattern) => pattern.length >= minPatternLength)
}

interface FallbackKeywordsOptions {
  maxItems?: number
  stopWords?: Set<string>
}

export function fallbackKeywords(prompt: string, options: FallbackKeywordsOptions = {}) {
  const { maxItems = DEFAULT_KEYWORD_MAX_ITEMS, stopWords = AI_PROMPT_STOP_WORDS } = options
  const cleaned = sanitizeFreeformText(prompt).toLowerCase()

  const tokens = cleaned
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token))

  const unique: string[] = []
  for (const token of tokens) {
    if (!unique.includes(token)) {
      unique.push(token)
    }

    if (unique.length >= maxItems) {
      break
    }
  }

  if (!unique.length && cleaned) {
    unique.push(cleaned.slice(0, 20))
  }

  return unique
}
