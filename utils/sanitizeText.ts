export function stripControlChars(value: string): string {
  if (!value) {
    return ''
  }

  let result = ''
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charAt(index)
    const code = char.charCodeAt(0)
    if ((code >= 0 && code <= 31) || code === 127) {
      result += ' '
    } else {
      result += char
    }
  }

  return result
}

export function normalizeWhitespace(value: string): string {
  if (!value) {
    return ''
  }

  return value.replace(/\s+/g, ' ').trim()
}

interface SanitizeFreeformOptions {
  maxLength?: number
  allowEmpty?: boolean
}

const DEFAULT_MAX_LENGTH = 500

export function sanitizeFreeform(value: unknown, options: SanitizeFreeformOptions = {}): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = normalizeWhitespace(stripControlChars(value.normalize('NFKC')))
  if (!normalized && !options.allowEmpty) {
    return undefined
  }

  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH
  return normalized.slice(0, maxLength)
}
