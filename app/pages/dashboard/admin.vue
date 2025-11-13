<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MediaDetailModal from '~/components/catalog/MediaDetailModal.vue'
import { useAdminMediaData, type AdminMediaItem, type SortField, type SortDirection } from '~/composables/useAdminMediaData'
import { useDebouncedRef } from '~/composables/useDebouncedRef'
import { useMediaDetail } from '~/composables/useMediaDetail'

definePageMeta({
  layout: 'dashboard',
  requiresAuth: true,
})

useHead({
  title: 'Admin catalog • Library Console',
})

const fallbackCover =
  'https://images.unsplash.com/photo-1526313199968-70e399ffe791?auto=format&fit=crop&w=512&q=80'

const mediaTypeLabelMap: Record<string, string> = {
  book: 'Book',
  video: 'Video',
  audio: 'Audio',
  other: 'Other',
}

const mediaTypeFilters = [
  { label: 'All', value: '' },
  { label: 'Books', value: 'book' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Other', value: 'other' },
]

const sortOptions: Array<{ label: string; value: SortField }> = [
  { label: 'Title', value: 'title' },
  { label: 'Created', value: 'created_at' },
  { label: 'Updated', value: 'updated_at' },
]

const directionOptions: Array<{ icon: string; label: string; value: SortDirection }> = [
  { label: 'Ascending', value: 'asc', icon: 'i-heroicons-arrow-up-20-solid' },
  { label: 'Descending', value: 'desc', icon: 'i-heroicons-arrow-down-20-solid' },
]

const {
  items,
  total,
  error,
  filters,
  hasMore,
  isInitialLoading,
  isLoadingMore,
  setSearch,
  setMediaType,
  setSort,
  setDirection,
  loadMore,
  refresh,
} = await useAdminMediaData()

const adminItems = computed(() => items.value ?? [])
const totalCount = computed(() => total.value ?? 0)
const visibleCount = computed(() => adminItems.value.length)
const listError = computed(() => error.value ?? null)

const searchInput = ref(filters.q ?? '')
const debouncedSearch = useDebouncedRef(searchInput, 300)

watch(
  () => filters.q ?? '',
  (value) => {
    if (value !== searchInput.value) {
      searchInput.value = value
    }
  },
)

watch(debouncedSearch, (value) => {
  if ((filters.q ?? '') !== value) {
    setSearch(value)
  }
})

const activeType = computed({
  get: () => filters.mediaType ?? '',
  set: (value: string) => setMediaType(value || undefined),
})

const activeSort = computed({
  get: () => filters.sort ?? 'title',
  set: (value: SortField) => setSort(value),
})

const activeDirection = computed({
  get: () => filters.direction ?? 'asc',
  set: (value: SortDirection) => setDirection(value),
})

const hasActiveFilters = computed(() => {
  const hasSearch = Boolean(filters.q && filters.q.length)
  const hasType = Boolean(filters.mediaType)
  const hasSort = (filters.sort ?? 'title') !== 'title'
  const hasDirection = (filters.direction ?? 'asc') !== 'asc'
  return hasSearch || hasType || hasSort || hasDirection
})

const {
  media: detailMedia,
  isOpen: isDetailOpen,
  isLoading: isDetailLoading,
  error: detailError,
  openWithMedia,
  close: closeDetail,
} = useMediaDetail()

function selectType(value: string) {
  activeType.value = value
}

function mediaTypeLabel(type: string | null | undefined) {
  if (!type) {
    return '—'
  }

  return mediaTypeLabelMap[type] ?? type
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ')
  }
}

function toDetail(item: AdminMediaItem) {
  const subjects = [item.genre, item.subject].filter((value): value is string => Boolean(value && value.trim()))
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    mediaType: item.mediaType,
    mediaFormat: item.mediaFormat,
    coverUrl: item.coverUrl ?? undefined,
    subjects,
    description: item.description,
    metadata: item.metadata,
    publishedAt: item.publishedAt ?? undefined,
  }
}

function handleView(item: AdminMediaItem) {
  openWithMedia(toDetail(item))
}

function handleEdit(item: AdminMediaItem) {
  console.info('[admin] edit action placeholder', item.id, item.title)
}

function handleDelete(item: AdminMediaItem) {
  console.info('[admin] delete action placeholder', item.id, item.title)
}

function startCreate() {
  console.info('[admin] create action placeholder')
}

function retryFetch() {
  refresh()
}
</script>

<template>
  <div class="space-y-8">
    <NuxtPageHeader>
      <template #title>Admin tools</template>
      <template #description>
        Search, review, and edit every media item in the collection. Create new entries or retire outdated records.
      </template>
    </NuxtPageHeader>

    <NuxtPageSection>
      <template #title>Manage media catalog</template>
      <template #description>
        Use search, filters, and sort controls to locate specific items. View details now—inline edit and delete
        actions wire up next.
      </template>

      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <NuxtInput
          v-model="searchInput"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search by title, creator, ISBN, or subject"
          size="md"
          class="w-full lg:w-96"
        />

        <div class="flex flex-wrap items-center gap-2">
          <NuxtButton
            v-for="filter in mediaTypeFilters"
            :key="filter.value"
            :variant="activeType === filter.value ? 'soft' : 'ghost'"
            color="primary"
            size="sm"
            class="capitalize"
            @click="selectType(filter.value)"
          >
            {{ filter.label }}
          </NuxtButton>

          <NuxtButton
            color="primary"
            icon="i-heroicons-plus-circle"
            size="sm"
            @click="startCreate"
          >
            Add media
          </NuxtButton>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-300">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing
            <span class="font-semibold text-slate-100">{{ visibleCount }}</span>
            of
            <span class="font-semibold text-slate-100">{{ totalCount }}</span>
            admin catalog records
          </p>
          <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
            <NuxtBadge v-if="hasActiveFilters" variant="soft" color="primary">
              Filters active
            </NuxtBadge>
            <NuxtBadge v-else variant="soft" color="neutral">
              Default view
            </NuxtBadge>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">Sort by</span>
            <div class="flex items-center gap-1">
              <NuxtButton
                v-for="option in sortOptions"
                :key="option.value"
                :variant="activeSort === option.value ? 'soft' : 'ghost'"
                color="neutral"
                size="xs"
                class="capitalize"
                @click="activeSort = option.value"
              >
                {{ option.label }}
              </NuxtButton>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <span class="text-slate-500">Direction</span>
            <NuxtButton
              v-for="option in directionOptions"
              :key="option.value"
              :variant="activeDirection === option.value ? 'soft' : 'ghost'"
              color="neutral"
              size="xs"
              :icon="option.icon"
              @click="activeDirection = option.value"
            >
              <span class="sr-only">{{ option.label }}</span>
            </NuxtButton>
          </div>
        </div>
      </div>

      <div class="mt-6 space-y-6">
        <div
          v-if="listError"
          class="rounded-2xl border border-red-500/40 bg-red-950/20 p-6 text-sm text-red-200"
        >
          <p class="font-medium">{{ listError instanceof Error ? listError.message : listError }}</p>
          <NuxtButton class="mt-4" size="sm" color="primary" variant="soft" @click="retryFetch">
            Retry fetch
          </NuxtButton>
        </div>

        <div v-else-if="isInitialLoading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="index in 9"
            :key="`admin-media-skeleton-${index}`"
            class="h-80 animate-pulse rounded-2xl border border-white/5 bg-slate-900/40"
          />
        </div>

        <div v-else-if="adminItems.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="item in adminItems"
            :key="item.id"
            class="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 transition hover:border-primary-500/60 hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div class="relative h-40 w-full overflow-hidden border-b border-white/5">
              <NuxtImg
                :src="item.coverUrl || fallbackCover"
                alt=""
                class="h-full w-full object-cover"
                sizes="(min-width: 768px) 240px, 80vw"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent" />
            </div>

            <div class="flex flex-1 flex-col gap-4 p-5 text-sm text-slate-300">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-500">
                    {{ mediaTypeLabel(item.mediaType) }} • {{ item.mediaFormat || 'Unknown format' }}
                  </p>
                  <h3 class="mt-1 text-lg font-semibold text-white">{{ item.title }}</h3>
                  <p class="text-xs text-slate-400">{{ item.author || 'Creator unknown' }}</p>
                </div>
              </div>

              <p class="line-clamp-3 text-sm leading-relaxed text-slate-300">
                {{ item.description || 'No description provided yet.' }}
              </p>

              <dl class="space-y-2 text-xs text-slate-400">
                <div class="flex items-center justify-between gap-2">
                  <dt class="uppercase tracking-wide text-slate-500">ISBN</dt>
                  <dd class="text-slate-200">{{ item.isbn || '—' }}</dd>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <dt class="uppercase tracking-wide text-slate-500">Language</dt>
                  <dd class="text-slate-200">{{ item.language || '—' }}</dd>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <dt class="uppercase tracking-wide text-slate-500">Updated</dt>
                  <dd class="text-slate-200">{{ formatDate(item.updatedAt) }}</dd>
                </div>
              </dl>

              <div v-if="item.genre || item.subject" class="flex flex-wrap gap-2 text-xs">
                <NuxtBadge
                  v-for="tag in [item.genre, item.subject].filter((value): value is string => Boolean(value))"
                  :key="`${item.id}-${tag}`"
                  color="neutral"
                  variant="outline"
                >
                  {{ tag }}
                </NuxtBadge>
              </div>

              <div class="mt-auto flex flex-wrap items-center gap-2 pt-2 text-xs">
                <NuxtButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-heroicons-eye"
                  @click="handleView(item)"
                >
                  View
                </NuxtButton>
                <NuxtButton
                  size="xs"
                  variant="soft"
                  color="primary"
                  icon="i-heroicons-pencil-square"
                  @click="handleEdit(item)"
                >
                  Edit
                </NuxtButton>
                <NuxtButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="handleDelete(item)"
                >
                  Delete
                </NuxtButton>
              </div>
            </div>
          </article>
        </div>

        <div
          v-else
          class="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-10 text-center text-sm text-slate-400"
        >
          No media matches those filters yet. Try adjusting the search or adding a new title.
        </div>

        <div v-if="hasMore" class="flex justify-center">
          <NuxtButton variant="soft" color="primary" :loading="isLoadingMore" @click="loadMore">
            Load more media
          </NuxtButton>
        </div>
      </div>
    </NuxtPageSection>

    <MediaDetailModal
      :open="isDetailOpen"
      :media="detailMedia"
      :loading="isDetailLoading"
      :error="detailError"
      @close="closeDetail"
    />
  </div>
</template>
