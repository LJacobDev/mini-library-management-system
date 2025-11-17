import { computed, reactive, ref, watch } from 'vue'
import { clampPage, clampPageSize } from '../../utils/pagination'

export const ADMIN_MEDIA_TYPES = ['book', 'video', 'audio', 'other'] as const
export type AdminMediaType = (typeof ADMIN_MEDIA_TYPES)[number]
export type SortField = 'title' | 'created_at' | 'updated_at'
export type SortDirection = 'asc' | 'desc'
const SORT_FIELDS: SortField[] = ['title', 'created_at', 'updated_at']
const SORT_DIRECTIONS: SortDirection[] = ['asc', 'desc']
const MIN_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 60
const MAX_QUERY_LENGTH = 300

export interface AdminMediaItem {
  id: string
  title: string
  author: string
  mediaType: AdminMediaType
  mediaFormat: string
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

interface AdminMediaFilters {
  q?: string
  mediaType?: AdminMediaType
  page?: number
  pageSize?: number
  sort?: SortField
  direction?: SortDirection
}

interface AdminMediaResponse {
  items: AdminMediaItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const DEFAULT_FILTERS: Required<Pick<AdminMediaFilters, 'page' | 'pageSize' | 'sort' | 'direction'>> = {
  page: 1,
  pageSize: 18,
  sort: 'title',
  direction: 'asc',
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

function normalizeSearchQuery(value?: string) {
  if (!value) {
    return undefined
  }

  const normalized = stripControlCharacters(value.normalize('NFKC'))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)

  return normalized.length ? normalized : undefined
}

function normalizeMediaTypeValue(type?: string) {
  if (!type) {
    return undefined
  }

  const normalized = type.trim().toLowerCase()
  return (ADMIN_MEDIA_TYPES as readonly string[]).includes(normalized)
    ? (normalized as AdminMediaType)
    : undefined
}

function normalizeSortField(sort?: SortField) {
  return sort && SORT_FIELDS.includes(sort) ? sort : DEFAULT_FILTERS.sort
}

function normalizeDirectionValue(direction?: SortDirection) {
  return direction && SORT_DIRECTIONS.includes(direction) ? direction : DEFAULT_FILTERS.direction
}

export async function useAdminMediaData(initialFilters: AdminMediaFilters = {}) {
  const filters = reactive<AdminMediaFilters & typeof DEFAULT_FILTERS>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  const queryParams = computed(() => ({
    page: clampPage(filters.page, DEFAULT_FILTERS.page),
    pageSize: clampPageSize(filters.pageSize, DEFAULT_FILTERS.pageSize, {
      min: MIN_PAGE_SIZE,
      max: MAX_PAGE_SIZE,
    }),
    q: normalizeSearchQuery(filters.q),
    mediaType: normalizeMediaTypeValue(filters.mediaType),
    sort: normalizeSortField(filters.sort),
    direction: normalizeDirectionValue(filters.direction),
  }))

  const cacheKey = computed(
    () =>
      `admin-media:${queryParams.value.page}:${queryParams.value.pageSize}:` +
      `${queryParams.value.q ?? ''}:${queryParams.value.mediaType ?? ''}:` +
  `${queryParams.value.sort}:${queryParams.value.direction}`,
  )

  const { data, pending, error, refresh } = await useAsyncData<AdminMediaResponse>(
    cacheKey,
    () =>
      $fetch<AdminMediaResponse>('/api/admin/media', {
        params: queryParams.value,
      }),
    {
      watch: [queryParams],
      default: () => ({ items: [], page: 1, pageSize: filters.pageSize, total: 0, totalPages: 1 }),
    },
  )

  const itemsStore = ref<AdminMediaItem[]>(data.value?.items ? [...data.value.items] : [])

  watch(
    () => data.value,
    (payload) => {
      if (!payload) {
        return
      }

      if (payload.page <= 1) {
        itemsStore.value = [...payload.items]
      } else {
        const existing = new Set(itemsStore.value.map((item) => item.id))
        const merged = payload.items.filter((item) => !existing.has(item.id))
        itemsStore.value = [...itemsStore.value, ...merged]
      }
    },
  { immediate: true },
  )

  const items = computed(() => itemsStore.value)
  const page = computed(() => data.value?.page ?? filters.page)
  const pageSize = computed(() => data.value?.pageSize ?? filters.pageSize)
  const total = computed(() => data.value?.total ?? itemsStore.value.length)
  const totalPages = computed(() => data.value?.totalPages ?? 1)
  const hasMore = computed(() => {
    const currentPage = filters.page ?? DEFAULT_FILTERS.page
    return currentPage < totalPages.value
  })

  const isInitialLoading = computed(
    () => pending.value && (filters.page ?? DEFAULT_FILTERS.page) <= 1 && itemsStore.value.length === 0,
  )

  const isLoadingMore = ref(false)

  watch(pending, (value) => {
    if (!value) {
      isLoadingMore.value = false
    }
  })

  function setPage(next: number) {
    const normalized = clampPage(next, DEFAULT_FILTERS.page)
    if (normalized !== filters.page) {
      filters.page = normalized
    }
  }

  function setPageSize(next: number) {
    const normalized = clampPageSize(next, DEFAULT_FILTERS.pageSize, {
      min: MIN_PAGE_SIZE,
      max: MAX_PAGE_SIZE,
    })
    if (normalized !== filters.pageSize) {
      filters.pageSize = normalized
      filters.page = 1
      itemsStore.value = []
    }
  }

  function setSearch(value: string) {
    const normalized = normalizeSearchQuery(value)
    if (filters.q === normalized) {
      return
    }

    filters.q = normalized
    filters.page = 1
    itemsStore.value = []
  }

  function setMediaType(type: string | undefined) {
    const normalized = normalizeMediaTypeValue(type)
    if (filters.mediaType === normalized) {
      return
    }

    filters.mediaType = normalized
    filters.page = 1
    itemsStore.value = []
  }

  function setSort(sort: SortField) {
    const normalized = normalizeSortField(sort)
    if (filters.sort === normalized) {
      return
    }

    filters.sort = normalized
    filters.page = 1
    itemsStore.value = []
  }

  function setDirection(direction: SortDirection) {
    const normalized = normalizeDirectionValue(direction)
    if (filters.direction === normalized) {
      return
    }

    filters.direction = normalized
    filters.page = 1
    itemsStore.value = []
  }

  function resetFilters() {
    filters.q = undefined
    filters.mediaType = undefined
    filters.sort = DEFAULT_FILTERS.sort
    filters.direction = DEFAULT_FILTERS.direction
    filters.page = DEFAULT_FILTERS.page
    filters.pageSize = DEFAULT_FILTERS.pageSize
    itemsStore.value = []
  }

  function loadMore() {
    if (isLoadingMore.value || pending.value || !hasMore.value) {
      return
    }

    isLoadingMore.value = true
    setPage((filters.page ?? DEFAULT_FILTERS.page) + 1)
  }

  return {
    items,
    data,
    pending,
    error,
    total,
    totalPages,
    page,
    pageSize,
    filters,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    refresh,
    setPage,
    setPageSize,
    setSearch,
    setMediaType,
    setSort,
    setDirection,
    resetFilters,
    loadMore,
  }
}
