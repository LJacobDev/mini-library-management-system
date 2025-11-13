import { computed, reactive, ref, watch } from 'vue'

export const ADMIN_MEDIA_TYPES = ['book', 'video', 'audio', 'other'] as const
export type AdminMediaType = (typeof ADMIN_MEDIA_TYPES)[number]
export type SortField = 'title' | 'created_at' | 'updated_at'
export type SortDirection = 'asc' | 'desc'

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
  mediaType?: AdminMediaType | ''
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

export async function useAdminMediaData(initialFilters: AdminMediaFilters = {}) {
  const filters = reactive<AdminMediaFilters & typeof DEFAULT_FILTERS>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  const queryParams = computed(() => ({
    page: filters.page,
    pageSize: filters.pageSize,
    q: filters.q || undefined,
    mediaType: filters.mediaType || undefined,
    sort: filters.sort,
    direction: filters.direction,
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
    const normalized = Math.max(1, Math.floor(next))
    if (normalized !== filters.page) {
      filters.page = normalized
    }
  }

  function setPageSize(next: number) {
    const normalized = Math.max(6, Math.floor(next))
    if (normalized !== filters.pageSize) {
      filters.pageSize = normalized
      filters.page = 1
      itemsStore.value = []
    }
  }

  function setSearch(value: string) {
    filters.q = value?.trim() || undefined
    filters.page = 1
    itemsStore.value = []
  }

  function setMediaType(type: string | undefined) {
    const normalized = type?.trim().toLowerCase() || undefined
    filters.mediaType = (normalized && ADMIN_MEDIA_TYPES.includes(normalized as AdminMediaType))
      ? (normalized as AdminMediaType)
      : undefined
    filters.page = 1
    itemsStore.value = []
  }

  function setSort(sort: SortField) {
    if (filters.sort !== sort) {
      filters.sort = sort
      filters.page = 1
      itemsStore.value = []
    }
  }

  function setDirection(direction: SortDirection) {
    if (filters.direction !== direction) {
      filters.direction = direction
      filters.page = 1
      itemsStore.value = []
    }
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
