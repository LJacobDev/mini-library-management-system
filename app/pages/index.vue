<script setup lang="ts">
import { computed, ref } from "vue";
import type { MockMediaStatus } from "~/composables/useCatalogMock";

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

const mediaTypeFilters = [
  { label: "All", value: "all" },
  { label: "Books", value: "book" },
  { label: "Magazines", value: "magazine" },
  { label: "DVDs", value: "dvd" },
  { label: "Audiobooks", value: "audiobook" }
];

const { items } = useCatalogMock({ take: 12 });

const searchTerm = ref("");
const activeType = ref<string>("all");

const statusMeta: Record<MockMediaStatus, { label: string; color: "success" | "warning" | "info" }> = {
  available: { label: "Available", color: "success" },
  checked_out: { label: "Checked out", color: "warning" },
  reserved: { label: "Reserved", color: "info" }
};

const filteredItems = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  return items.value.filter((item) => {
    const matchesType = activeType.value === "all" || item.mediaType === activeType.value;
    const matchesTerm =
      !term ||
      [item.title, item.author, item.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term);
    return matchesType && matchesTerm;
  });
});

function selectType(value: string) {
  activeType.value = value;
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
              v-model="searchTerm"
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

        <div v-if="filteredItems.length" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <NuxtCard
            v-for="item in filteredItems"
            :key="item.id"
            class="flex h-full flex-col overflow-hidden border border-white/5 bg-slate-900/70"
          >
            <div class="relative">
              <NuxtImg :src="item.coverUrl" alt="" class="h-44 w-full object-cover" loading="lazy" />
              <NuxtBadge :color="statusMeta[item.status].color" variant="solid" class="absolute left-3 top-3">
                {{ statusMeta[item.status].label }}
              </NuxtBadge>
            </div>

            <div class="flex flex-1 flex-col gap-3 p-5">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-400">
                  {{ item.mediaType }} • {{ item.callNumber }}
                </p>
                <h4 class="mt-2 text-lg font-semibold text-white">{{ item.title }}</h4>
                <p class="text-sm text-slate-400">{{ item.author }}</p>
              </div>

              <div class="flex flex-wrap gap-2">
                <NuxtBadge
                  v-for="tag in item.tags"
                  :key="tag"
                  color="neutral"
                  variant="outline"
                  class="text-xs"
                >
                  {{ tag }}
                </NuxtBadge>
              </div>

              <div class="mt-auto flex items-center justify-between text-xs text-slate-500">
                <span>Published {{ item.publishedAt }}</span>
                <NuxtButton size="xs" variant="ghost" color="primary" icon="i-heroicons-eye" label="Details" />
              </div>
            </div>
          </NuxtCard>
        </div>

        <div
          v-else
          class="min-h-[200px] rounded-3xl border border-dashed border-slate-700/70 bg-slate-900/40 p-10 text-center text-sm text-slate-400"
        >
          No matching items yet. Try a different search or filter.
        </div>
      </div>
    </section>
  </main>
</template>