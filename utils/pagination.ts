export function resolvePositiveInteger(value: unknown, fallback: number): number {
  if (Array.isArray(value) && value.length) {
    return resolvePositiveInteger(value[0], fallback)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value))
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length > 0) {
      const parsed = Number.parseInt(trimmed, 10)
      if (!Number.isNaN(parsed)) {
        return Math.max(1, parsed)
      }
    }
  }

  return fallback
}

export function clampPage(value: unknown, fallback = 1): number {
  return resolvePositiveInteger(value, fallback)
}

interface ClampPageSizeOptions {
  min?: number
  max?: number
}

export function clampPageSize(value: unknown, fallback: number, options: ClampPageSizeOptions = {}): number {
  const min = Math.max(1, options.min ?? 1)
  const max = options.max ?? Number.POSITIVE_INFINITY
  const normalized = resolvePositiveInteger(value, fallback)

  const clampedMin = Math.max(min, normalized)
  return Math.min(max, clampedMin)
}
