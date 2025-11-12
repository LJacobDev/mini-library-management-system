<script setup lang="ts">
import type { MockMediaStatus } from "~/composables/useCatalogMock";

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



const { items } = useCatalogMock({ take: 18 });

const statusMeta: Record<MockMediaStatus, { label: string; color: "success" | "warning" | "info" }> = {
  available: { label: "Available", color: "success" },
  checked_out: { label: "Checked out", color: "warning" },
  reserved: { label: "Reserved", color: "info" }
};
</script>

<template>
  <div class="space-y-6">
    <NuxtPageHeader
      title="Catalog"
      description="Browse and manage the library's collection. Filters, search, and detailed media cards will live here."
      :breadcrumbs="breadcrumbs"
    />

    <NuxtPageSection>
    import type { MockMediaStatus } from "~/composables/useCatalogMock";
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <h3 class="text-base font-semibold text-slate-200">Collection preview</h3>
          <NuxtButton
            color="primary"
            variant="soft"
            icon="i-heroicons-arrow-down-tray"
            label="Export list"
          />
        </div>
      </template>

      <div v-if="items.length" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <NuxtCard
          v-for="item in items"
          :key="item.id"
          class="flex flex-col overflow-hidden border border-white/5 bg-slate-900/60"
        >
          <div class="relative">
            <NuxtImg
              :src="item.coverUrl"
              alt=""
              class="h-44 w-full object-cover"
              loading="lazy"
            />
            <NuxtBadge
              :color="statusMeta[item.status].color"
              variant="solid"
              class="absolute left-3 top-3"
            >
              {{ statusMeta[item.status].label }}
            </NuxtBadge>
          </div>

          <div class="flex flex-1 flex-col gap-4 p-5">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">
                {{ item.mediaType }} • {{ item.callNumber }}
              </p>
              <h4 class="mt-2 text-lg font-semibold text-slate-100">{{ item.title }}</h4>
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
        No titles yet — populate the mock composable to see catalog entries.
      </div>
    </NuxtPageSection>
  </div>
</template>
