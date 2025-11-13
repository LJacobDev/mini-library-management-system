<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

definePageMeta({ ssr: true });

useHead({
  title: "Great City Community Library",
  meta: [
    {
      name: "description",
      content:
        "Explore the Great City Community Library catalog, discover new favorites, and reserve items when you sign in."
    }
  ]
});

const heroImage =
  "https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/site-images/hero-2-resized-Gemini_Generated_Image_taeikjtaeikjtaei.png";
const interiorImage =
  "https://sxuxezmcmkgcltkaprmk.supabase.co/storage/v1/object/public/covers/site-images/library-interior-resized-galen-crout-zHgyrDmhGVo-unsplash.png";

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
  error,
  filters,
  setSearch,
  setMediaType,
  setPage,
  loadMore,
  hasMore,
  isInitialLoading,
  isLoadingMore
} = useCatalogData({ pageSize: 12 });

const searchInput = ref(filters.q ?? "");
const SEARCH_DEBOUNCE_MS = 300;

watch(
  () => filters.q ?? "",
  (value) => {
    if (value !== searchInput.value) {
      searchInput.value = value;
    }
  }
);

watch(
  searchInput,
  (value, _previous, onCleanup) => {
    const timeout = setTimeout(() => {
      setSearch(value);
    }, SEARCH_DEBOUNCE_MS);

    onCleanup(() => clearTimeout(timeout));
  }
);

const activeType = computed({
  get: () => filters.type ?? "",
  set: (value: string) => setMediaType(value || undefined)
});

const filteredItems = computed(() => items.value ?? []);

function selectType(value: string) {
  activeType.value = value;
  setPage(1);
}

function mediaTypeLabel(type: string) {
  return mediaTypeLabelMap[type] ?? type;
}

const loadMoreRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      });
    },
    { rootMargin: "200px" }
  );

  if (loadMoreRef.value) {
    observer.observe(loadMoreRef.value);
  }
});

watch(
  loadMoreRef,
  (el, prev) => {
    if (!observer) {
      return;
    }
    if (prev) {
      observer.unobserve(prev);
    }
    if (el) {
      observer.observe(el);
    }
  }
);

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<template>
  <main class="bg-slate-950 text-slate-100">
    <section class="relative overflow-hidden">
      <div class="mx-auto flex w-full max-w-6xl flex-col-reverse items-center gap-10 px-6 py-16 lg:flex-row lg:py-24">
  <div class="flex-1 space-y-6 text-center lg:text-left">
          <p class="text-sm uppercase tracking-widest text-primary-300">Welcome to</p>
          <h1 class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Great City Community Library
          </h1>
          <p class="mx-auto max-w-xl text-lg text-slate-300 lg:mx-0">
            Discover books, magazines, films, and more—curated for every member. Explore the
            catalog, place holds, and keep up with the latest arrivals - all online!
          </p>
          <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <NuxtButton to="#catalog" color="primary" size="lg" icon="i-heroicons-magnifying-glass">
              Browse catalog
            </NuxtButton>
          </div>
        </div>

  <div class="flex-1 w-full max-w-xl self-center mx-auto lg:max-w-none lg:self-stretch lg:mx-0">
          <div class="overflow-hidden rounded-3xl border border-white/10 shadow-xl">
            <NuxtImg
              :src="heroImage"
              alt="Great City Community Library exterior"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-900/60">
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center">
        <div class="flex-1 w-full max-w-xl self-center mx-auto lg:max-w-none lg:self-stretch lg:mx-0">
          <div class="overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-primary-500/10">
            <NuxtImg
              :src="interiorImage"
              alt="Library interior"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div class="flex-1 space-y-5 text-center lg:self-center">
          <h2 class="mx-auto max-w-xl text-3xl font-semibold text-white">Visit us in the heart of Great City</h2>
          <p class="mx-auto max-w-xl text-slate-300">
            Settle into a cozy reading nook, drop by a workshop, or meet neighbors at one of our weekly events.
            There’s always something new happening here.
          </p>

          <div class="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-300">
            <p class="font-semibold text-white">Downtown Branch</p>
            <p>415 Library Lane, Great City, GC 20415</p>
            <p>(555) 867-3200</p>
            <div class="mt-3 space-y-1">
              <p>Mon–Thu · 9:00 AM – 8:00 PM</p>
              <p>Fri–Sat · 9:00 AM – 6:00 PM</p>
              <p>Sun · 12:00 PM – 5:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="catalog" class="mx-auto w-full max-w-6xl px-6 py-16">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 class="text-2xl font-semibold text-white">Newest arrivals</h3>
            <p class="text-sm text-slate-400">Refine by media type or search to find exactly what you need.</p>
          </div>

          <div class="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <NuxtInput
              v-model="searchInput"
              icon="i-heroicons-magnifying-glass"
              placeholder="Search by title, author, or tag"
              size="md"
              class="w-full sm:w-80"
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
        </div>

        <div v-if="isInitialLoading" class="catalog-grid">
          <NuxtCard v-for="n in 12" :key="n" class="h-64 animate-pulse border border-white/5 bg-slate-900/40" />
        </div>

        <div v-else-if="error" class="min-h-[200px] rounded-3xl border border-dashed border-red-500/40 bg-red-950/20 p-10 text-center text-sm text-red-200">
          Unable to load catalog right now. Please try again shortly.
        </div>

        <div v-else-if="filteredItems.length" class="catalog-grid">
          <NuxtCard
            v-for="item in filteredItems"
            :key="item.id"
            class="flex h-full flex-col overflow-hidden border border-white/5 bg-slate-900/70"
          >
            <div class="relative">
              <NuxtImg :src="item.coverUrl || fallbackCover" alt="" class="h-44 w-full object-cover" loading="lazy" />
            </div>

            <div class="flex flex-1 flex-col gap-3 p-5">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">
                  {{ mediaTypeLabel(item.mediaType) }}
                </p>
                <h4 class="mt-2 text-lg font-semibold text-white">{{ item.title }}</h4>
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
                <NuxtButton size="xs" variant="ghost" color="primary" icon="i-heroicons-eye" label="Details" />
              </div>
            </div>
          </NuxtCard>
        </div>

        <div v-else class="min-h-[200px] rounded-3xl border border-dashed border-slate-700/70 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
          No matching items yet. Try a different search or filter.
        </div>

        <div
          v-if="hasMore"
          ref="loadMoreRef"
          class="mt-8 flex flex-col items-center gap-4 text-sm text-slate-400"
        >
          <NuxtButton
            variant="soft"
            color="primary"
            :loading="isLoadingMore"
            @click="loadMore"
          >
            Load more titles
          </NuxtButton>
          <p v-if="isLoadingMore" class="text-xs text-slate-500">Fetching more from the stacks…</p>
        </div>
      </div>
    </section>
  </main>
</template>