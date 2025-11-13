import { computed, reactive, ref, watch } from 'vue'

const MEDIA_TYPES = ['book', 'video', 'audio', 'other'] as const
export type MediaType = (typeof MEDIA_TYPES)[number]

function isMediaType(value: string | null | undefined): value is MediaType {
  return value ? (MEDIA_TYPES as readonly string[]).includes(value) : false
}

interface CatalogFilters {
  q?: string
  type?: MediaType
  page?: number
  pageSize?: number
}

export interface CatalogItem {
  id: string
  title: string
  author: string
  mediaType: MediaType
  mediaFormat?: string
  coverUrl?: string | null
  subjects?: string[]
  description?: string | null
  publishedAt?: string | null
  metadata?: Record<string, unknown>
}

interface CatalogResponse {
  items: CatalogItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  nextPage: number | null
  nextCursor: string | null
}

const DEFAULT_FILTERS: Required<Pick<CatalogFilters, 'page' | 'pageSize'>> = {
  page: 1,
  pageSize: 24,
}

export async function useCatalogData(initialFilters: CatalogFilters = {}) {
  const filters = reactive<CatalogFilters & typeof DEFAULT_FILTERS>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  const queryParams = computed(() => ({
    page: filters.page,
    pageSize: filters.pageSize,
    q: filters.q || undefined,
    type: filters.type || undefined,
  }))

  const cacheKey = computed(
    () =>
      `catalog:${queryParams.value.page}:${queryParams.value.pageSize}:` +
      `${queryParams.value.q ?? ''}:${queryParams.value.type ?? ''}`
  )

  const { data, pending, error, refresh } = await useAsyncData<CatalogResponse>(
    cacheKey,
    () =>
      $fetch<CatalogResponse>('/api/catalog', {
        params: queryParams.value,
      }),
    {
      watch: [queryParams],
    }
  )

  const itemsStore = ref<CatalogItem[]>(data.value?.items ? [...data.value.items] : [])

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
    { immediate: true }
  )

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
    { immediate: true }
  )

  const items = computed(() => itemsStore.value)
  const page = computed(() => data.value?.page ?? filters.page)
  const pageSize = computed(() => data.value?.pageSize ?? filters.pageSize)
  const total = computed(() => data.value?.total ?? 0)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const hasMore = computed(() => data.value?.hasMore ?? false)
  const nextPage = computed(() => data.value?.nextPage)
  const isInitialLoading = computed(
    () => pending.value && (filters.page ?? DEFAULT_FILTERS.page) <= 1 && itemsStore.value.length === 0
  )

  const isLoadingMore = ref(false)

  watch(pending, (value) => {
    if (!value) {
      isLoadingMore.value = false
    }
  })

  watch(
    () => [filters.page, totalPages.value],
    ([currentPage, maxPages]) => {
      const safeCurrent = currentPage ?? DEFAULT_FILTERS.page
      const safeMax = maxPages ?? DEFAULT_FILTERS.page
      if (safeCurrent > safeMax) {
        filters.page = safeMax
      }
    }
  )

  function setPage(page: number) {
    filters.page = Math.max(1, Math.floor(page))
  }

  function setPageSize(size: number) {
    const next = Math.max(1, Math.floor(size))
    if (next !== filters.pageSize) {
      filters.pageSize = next
      filters.page = 1
      itemsStore.value = []
    }
  }

  function setSearch(query: string) {
    filters.q = query?.trim() || undefined
    filters.page = 1
    itemsStore.value = []
  }

  function setMediaType(type: string | null | undefined) {
    const normalized = type?.trim().toLowerCase() || undefined
    filters.type = normalized && isMediaType(normalized) ? normalized : undefined
    filters.page = 1
    itemsStore.value = []
  }

  function resetFilters() {
    filters.page = DEFAULT_FILTERS.page
    filters.pageSize = DEFAULT_FILTERS.pageSize
    filters.q = undefined
    filters.type = undefined
    itemsStore.value = []
  }

  function loadMore() {
    if (isLoadingMore.value || pending.value || !hasMore.value) {
      return
    }

    isLoadingMore.value = true
    const candidate = (filters.page ?? DEFAULT_FILTERS.page) + 1
    const capped = nextPage.value && candidate > nextPage.value ? nextPage.value : candidate
    setPage(capped ?? candidate)
  }

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasMore,
    nextPage,
    data,
    pending,
    isInitialLoading,
    isLoadingMore,
    error,
    refresh,
    filters,
    setPage,
    setPageSize,
    setSearch,
    setMediaType,
    resetFilters,
    loadMore,
  }
}
