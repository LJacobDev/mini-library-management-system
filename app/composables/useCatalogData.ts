import { computed, reactive } from 'vue'

interface CatalogFilters {
  q?: string
  type?: string
  page?: number
  pageSize?: number
}

interface CatalogItem {
  id: string
  title: string
  author: string
  mediaType: string
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
}

const DEFAULT_FILTERS: Required<Pick<CatalogFilters, 'page' | 'pageSize'>> = {
  page: 1,
  pageSize: 24,
}

export function useCatalogData(initialFilters: CatalogFilters = {}) {
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

  const { data, pending, error, refresh } = useAsyncData<CatalogResponse>(
    cacheKey,
    () =>
      $fetch<CatalogResponse>('/api/catalog', {
        params: queryParams.value,
      }),
    {
      watch: [queryParams],
    }
  )

  const items = computed(() => data.value?.items ?? [])
  const page = computed(() => data.value?.page ?? filters.page)
  const pageSize = computed(() => data.value?.pageSize ?? filters.pageSize)
  const total = computed(() => data.value?.total ?? 0)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

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
    }
  }

  function setSearch(query: string) {
    filters.q = query?.trim() || undefined
    filters.page = 1
  }

  function setMediaType(type: string | null | undefined) {
    filters.type = type?.trim() || undefined
    filters.page = 1
  }

  function resetFilters() {
    filters.page = DEFAULT_FILTERS.page
    filters.pageSize = DEFAULT_FILTERS.pageSize
    filters.q = undefined
    filters.type = undefined
  }

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    data,
    pending,
    error,
    refresh,
    filters,
    setPage,
    setPageSize,
    setSearch,
    setMediaType,
    resetFilters,
  }
}
