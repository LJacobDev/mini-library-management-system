<script setup lang="ts">
import { computed, ref, watch } from "vue";
import MediaDetailModal from "~/components/catalog/MediaDetailModal.vue";
import type { CatalogItem } from "~/composables/useCatalogData";

definePageMeta({
  layout: "dashboard",
  requiresAuth: true
});

useHead({
  title: "Catalog • Library Console"
});

const breadcrumbs = [
  { label: "Workspace", to: "/status" },
  { label: "Catalog", to: "/catalog" }
];

const fallbackCover =
  "https://images.unsplash.com/photo-1526313199968-70e399ffe791?auto=format&fit=crop&w=512&q=80";

const mediaTypeFilters = [
  { label: "All", value: "" },
  { label: "Books", value: "book" },
  { label: "Video", value: "video" },
  { label: "Audio", value: "audio" },
  { label: "Other", value: "other" }
];

const mediaTypeLabelMap: Record<string, string> = {
  book: "Book",
  video: "Video",
  audio: "Audio",
  other: "Other"
};

const {
  items,
  total,
  error,
  filters,
  setSearch,
  setMediaType,
  setPage,
  loadMore,
  hasMore,
  isInitialLoading,
  isLoadingMore
} = await useCatalogData();

const catalogItems = computed(() => items.value ?? []);
const catalogError = computed(() => error.value ?? null);
const visibleCount = computed(() => catalogItems.value.length);
const totalCount = computed(() => total.value ?? 0);

const searchInput = ref(filters.q ?? "");
const SEARCH_DEBOUNCE_MS = 300;
const debouncedSearch = useDebouncedRef(searchInput, SEARCH_DEBOUNCE_MS);

watch(
  () => filters.q ?? "",
  (value) => {
    if (value !== searchInput.value) {
      searchInput.value = value;
    }
  }
);

watch(debouncedSearch, (value) => {
  if ((filters.q ?? "") !== value) {
    setSearch(value);
  }
});

const activeType = computed({
  get: () => filters.type ?? "",
  set: (value: string) => setMediaType(value || undefined)
});

const hasActiveFilters = computed(() => Boolean((filters.q ?? "").length || (filters.type ?? "")));

const {
  media: detailMedia,
  isOpen: isDetailOpen,
  isLoading: isDetailLoading,
  error: detailError,
  openWithMedia,
  close: closeDetail,
} = useMediaDetail();

function selectType(value: string) {
  activeType.value = value;
  setPage(1);
}

function handleSelect(item: CatalogItem) {
  openWithMedia(item);
}
</script>

<template>
  <div class="space-y-8">
    <NuxtPageHeader>
      <template #title>Catalog</template>
      <template #description>
        Search the collection, review availability, and keep metadata current for every title in the system.
      </template>
      <template #breadcrumb>
        <NuxtBreadcrumb :items="breadcrumbs" />
      </template>
    </NuxtPageHeader>

    <NuxtPageSection>
      <template #title>Browse collection</template>
      <template #description>
        Use quick filters or search to find materials. Select an item to open its detail drawer.
      </template>

      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <NuxtInput
          v-model="searchInput"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search by title, author, or tag"
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

        </div>
      </div>

      <CatalogGrid
        class="mt-6"
        :items="catalogItems"
        :is-initial-loading="isInitialLoading"
        :is-loading-more="isLoadingMore"
        :has-more="hasMore"
        :error="catalogError"
        :fallback-cover="fallbackCover"
        :media-type-labels="mediaTypeLabelMap"
        @select="handleSelect"
        @load-more="loadMore"
      >
        <template #header>
          <div class="rounded-xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-300">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing
                <span class="font-semibold text-slate-100">{{ visibleCount }}</span>
                of
                <span class="font-semibold text-slate-100">{{ totalCount }}</span>
                catalog entries
              </p>
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <NuxtBadge v-if="hasActiveFilters" variant="soft" color="primary" class="uppercase tracking-wide">
                  Filters active
                </NuxtBadge>
                <NuxtBadge v-else variant="soft" color="neutral" class="uppercase tracking-wide">
                  All media types
                </NuxtBadge>
              </div>
            </div>
          </div>
        </template>
      </CatalogGrid>
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
