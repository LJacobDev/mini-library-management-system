<script setup lang="ts">
import { computed, ref, watch } from "vue";
import AgentChatPanel from "~/components/AgentChatPanel.vue";
import MediaDetailModal from "~/components/catalog/MediaDetailModal.vue";
import type { CatalogItem } from "~/composables/useCatalogData";

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
} = await useCatalogData({ pageSize: 12 });

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

const filteredItems = computed(() => items.value ?? []);
const catalogError = computed(() => error.value ?? null);

const {
  media: detailMedia,
  isOpen: isDetailOpen,
  isLoading: isDetailLoading,
  error: detailError,
  openWithMedia,
  close: closeDetail,
} = useMediaDetail();

const { user } = useSupabaseAuth();
const isAuthenticated = computed(() => Boolean(user.value));
const isReserving = ref(false);
const reserveFeedback = ref<string | null>(null);

watch(
  () => detailMedia.value?.id,
  () => {
    isReserving.value = false;
    reserveFeedback.value = null;
  }
);

function selectType(value: string) {
  activeType.value = value;
  setPage(1);
}

function handleSelect(item: CatalogItem) {
  openWithMedia(item);
}

function resetReserveState() {
  isReserving.value = false;
  reserveFeedback.value = null;
}

function closeDetailModal() {
  resetReserveState();
  closeDetail();
}

async function requestReserve() {
  if (!detailMedia.value || !isAuthenticated.value) {
    return;
  }

  try {
    isReserving.value = true;
    await new Promise((resolve) => setTimeout(resolve, 400));
    reserveFeedback.value = `Reservation request queued for “${detailMedia.value.title}”. (stub)`;
  } finally {
    isReserving.value = false;
  }
}

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
            Discover lifechanging books, informative magazines, exciting films, and more. Explore the
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

        <ClientOnly>
          <section class="border-t border-white/10 bg-slate-900/70">
            <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-14">
              <header class="flex flex-col gap-2 text-center text-white sm:text-left">
                <p class="text-sm uppercase tracking-widest text-primary-300">Personalized picks</p>
                <h2 class="text-3xl font-semibold">Ask our AI concierge for recommendations</h2>
                <p class="text-sm text-slate-300">
                  Signed-in members can request hand-picked titles with real-time streaming suggestions.
                </p>
              </header>

              <div v-if="isAuthenticated" class="min-h-[480px]">
                <AgentChatPanel />
              </div>
              <NuxtCard v-else class="border border-white/10 bg-slate-900/80 p-6 text-center text-slate-200">
                <h3 class="text-lg font-semibold text-white">Sign in to try the concierge</h3>
                <p class="mt-2 text-sm text-slate-400">
                  Log in to request personalized recommendations and track your loans.
                </p>
                <div class="mt-4 flex justify-center">
                  <NuxtButton to="/login" color="primary" icon="i-heroicons-arrow-right-circle">
                    Go to login
                  </NuxtButton>
                </div>
              </NuxtCard>
            </div>
          </section>
        </ClientOnly>

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

        <CatalogGrid
          :items="filteredItems"
          :is-initial-loading="isInitialLoading"
          :is-loading-more="isLoadingMore"
          :has-more="hasMore"
          :error="catalogError"
          :fallback-cover="fallbackCover"
          :media-type-labels="mediaTypeLabelMap"
          @select="handleSelect"
          @load-more="loadMore"
        />
      </div>
    </section>

    <MediaDetailModal
      :open="isDetailOpen"
      :media="detailMedia"
      :loading="isDetailLoading"
      :error="detailError"
      @close="closeDetailModal"
    >
      <template #actions>
        <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p v-if="!isAuthenticated" class="text-xs text-slate-400">
            Sign in to reserve this title online.
          </p>
          <div class="flex w-full justify-end gap-2 sm:w-auto">
            <NuxtButton variant="ghost" color="neutral" :disabled="isDetailLoading" @click="closeDetailModal">
              Close
            </NuxtButton>
            <NuxtButton
              v-if="isAuthenticated"
              color="primary"
              :loading="isReserving"
              :disabled="isDetailLoading || !detailMedia"
              @click="requestReserve"
            >
              Reserve
            </NuxtButton>
            <NuxtButton v-else color="primary" variant="soft" disabled>
              Reserve
            </NuxtButton>
          </div>
        </div>
        <p v-if="reserveFeedback" class="text-xs text-primary-300">
          {{ reserveFeedback }}
        </p>
      </template>
    </MediaDetailModal>
  </main>
</template>