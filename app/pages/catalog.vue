<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  requiresAuth: true
});

useHead({
  title: "Catalog • Mini Library Management System"
});

const breadcrumbs = [
  { label: "Home", to: "/status" },
  { label: "Catalog", to: "/catalog" }
];

const fallbackCover =
  "https://images.unsplash.com/photo-1526313199968-70e399ffe791?auto=format&fit=crop&w=512&q=80";

const {
  items,
  pending,
  error,
  filters,
  setSearch,
  setMediaType,
  setPage,
  page,
  totalPages
} = useCatalogData();

const searchTerm = computed({
  get: () => filters.q ?? "",
  set: (value: string) => setSearch(value)
});

const activeType = computed({
  get: () => filters.type ?? "",
  set: (value: string) => setMediaType(value || undefined)
});

const mediaTypeFilters = [
  { label: "All", value: "" },
  { label: "Books", value: "book" },
  { label: "Video", value: "video" },
  { label: "Audio", value: "audio" },
  { label: "Other", value: "other" }
];

const displayItems = computed(() => items.value ?? []);

function selectType(value: string) {
  activeType.value = value;
  setPage(1);
}

const mediaTypeLabelMap: Record<string, string> = {
  book: "Book",
  video: "Video",
  audio: "Audio",
  other: "Other"
};

function mediaTypeLabel(type: string) {
  return mediaTypeLabelMap[type] ?? type;
}
</script>

<template>
  <div class="space-y-6">
    <NuxtPageHeader
      title="Catalog"
      description="Browse and manage the library's collection. Filters, search, and detailed media cards will live here."
      :breadcrumbs="breadcrumbs"
    />

    <NuxtPageSection>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-1">
            <h3 class="text-base font-semibold text-slate-200">Collection preview</h3>
            <p class="text-xs text-slate-500">Search and filter the live Supabase catalog.</p>
          </div>
          <NuxtButton
            color="primary"
            variant="soft"
            icon="i-heroicons-arrow-down-tray"
            label="Export list"
          />
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <NuxtInput
            v-model="searchTerm"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search title, creator, or subject"
            size="md"
            class="w-full sm:w-72"
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
      </template>

      <div v-if="pending" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <NuxtCard v-for="n in 9" :key="n" class="h-64 animate-pulse border border-white/5 bg-slate-900/40" />
      </div>

      <div
        v-else-if="error"
        class="grid min-h-80 place-content-center rounded-2xl border border-dashed border-red-500/40 bg-red-950/20 p-12 text-center text-sm text-red-200"
      >
        Unable to load the catalog right now. Please refresh or check the Supabase connection.
      </div>

      <div v-else-if="displayItems.length" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <NuxtCard
          v-for="item in displayItems"
          :key="item.id"
          class="flex flex-col overflow-hidden border border-white/5 bg-slate-900/60"
        >
          <div class="relative">
            <NuxtImg
              :src="item.coverUrl || fallbackCover"
              alt=""
              class="h-44 w-full object-cover"
              loading="lazy"
            />
          </div>

          <div class="flex flex-1 flex-col gap-4 p-5">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">
                {{ mediaTypeLabel(item.mediaType) }}
              </p>
              <h4 class="mt-2 text-lg font-semibold text-slate-100">{{ item.title }}</h4>
              <p class="text-sm text-slate-400">{{ item.author }}</p>
            </div>

            <div v-if="item.subjects?.length" class="flex flex-wrap gap-2">
              <NuxtBadge
                v-for="subject in item.subjects"
                :key="subject"
                color="neutral"
                variant="outline"
                class="text-xs"
              >
                {{ subject }}
              </NuxtBadge>
            </div>

            <div class="mt-auto flex items-center justify-between text-xs text-slate-500">
              <span>Published {{ item.publishedAt }}</span>
              <NuxtButton
                size="xs"
                variant="ghost"
                color="primary"
                icon="i-heroicons-eye"
                label="Details"
              />
            </div>
          </div>
        </NuxtCard>
      </div>

      <div
        v-else
        class="grid min-h-80 place-content-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-12 text-center text-sm text-slate-400"
      >
        No titles match the current filters. Try adjusting search or media type.
      </div>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span>Page {{ page }} of {{ totalPages }}</span>
          </div>
          <div class="flex gap-2">
            <NuxtButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-chevron-left"
              :disabled="page <= 1"
              @click="setPage(page - 1)"
            />
            <NuxtButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-chevron-right"
              :disabled="page >= totalPages"
              @click="setPage(page + 1)"
            />
          </div>
        </div>
      </template>
    </NuxtPageSection>
  </div>
</template>
