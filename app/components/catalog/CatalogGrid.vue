<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { PropType } from "vue";
import type { CatalogItem } from "~/composables/useCatalogData";

const props = defineProps({
  items: {
    type: Array as PropType<CatalogItem[]>,
    default: () => []
  },
  isInitialLoading: {
    type: Boolean,
    default: false
  },
  isLoadingMore: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  error: {
    type: [String, Object] as PropType<string | Error | null>,
    default: null
  },
  fallbackCover: {
    type: String,
    required: true
  },
  mediaTypeLabels: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({})
  },
  skeletonCount: {
    type: Number,
    default: 12
  },
  showLoadMoreButton: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits<{
  (event: "select", payload: CatalogItem): void;
  (event: "load-more"): void;
}>();

const errorMessage = computed(() => {
  const value = props.error;
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  return "Unable to load the catalog right now. Please try again.";
});

const loadMoreTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

function mediaTypeLabel(type: string | undefined) {
  if (!type) {
    return "";
  }

  return props.mediaTypeLabels[type] ?? type;
}

function handleSelect(item: CatalogItem) {
  emit("select", item);
}

function ensureObserver() {
  if (observer) {
    return observer;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          emit("load-more");
        }
      });
    },
    { rootMargin: "200px" }
  );

  return observer;
}

function observeTrigger() {
  if (!props.hasMore || !props.showLoadMoreButton) {
    return;
  }

  if (!loadMoreTrigger.value) {
    return;
  }

  const activeObserver = ensureObserver();
  activeObserver.observe(loadMoreTrigger.value);
}

function unobserveTrigger(target?: HTMLElement | null) {
  if (!observer) {
    return;
  }

  const node = target ?? loadMoreTrigger.value;
  if (node) {
    observer.unobserve(node);
  }
}

watch(
  () => loadMoreTrigger.value,
  (current, previous) => {
    if (previous) {
      unobserveTrigger(previous);
    }

    if (current) {
      observeTrigger();
    }
  }
);

watch(
  () => [props.hasMore, props.showLoadMoreButton],
  () => {
    if (!props.hasMore || !props.showLoadMoreButton) {
      unobserveTrigger();
      return;
    }

    observeTrigger();
  }
);

onMounted(() => {
  observeTrigger();
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <slot name="header" />

    <div v-if="isInitialLoading" class="catalog-grid">
      <NuxtCard
        v-for="n in skeletonCount"
        :key="`catalog-skeleton-${n}`"
        class="h-64 animate-pulse border border-white/5 bg-slate-900/40"
      />
    </div>

    <div v-else-if="errorMessage" class="min-h-[200px] rounded-3xl border border-dashed border-red-500/40 bg-red-950/20 p-10 text-center text-sm text-red-200">
      <slot name="error" :message="errorMessage">
        {{ errorMessage }}
      </slot>
    </div>

    <div v-else-if="items.length" class="catalog-grid">
      <NuxtCard
        v-for="item in items"
        :key="item.id"
        class="flex h-full flex-col overflow-hidden border border-white/5 bg-slate-900/70 transition hover:border-primary-500/60 hover:shadow-lg hover:shadow-primary-500/10"
        role="button"
        tabindex="0"
        @click="handleSelect(item)"
        @keyup.enter="handleSelect(item)"
        @keyup.space.prevent="handleSelect(item)"
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
            <NuxtButton
              size="xs"
              variant="ghost"
              color="primary"
              icon="i-heroicons-eye"
              label="Details"
              @click.stop="handleSelect(item)"
            />
          </div>
        </div>
      </NuxtCard>
    </div>

    <div
      v-else
      class="min-h-[200px] rounded-3xl border border-dashed border-slate-700/70 bg-slate-900/40 p-10 text-center text-sm text-slate-400"
    >
      <slot name="empty">
        No matching items yet. Try a different search or filter.
      </slot>
    </div>

    <slot name="footer">
      <div
        v-if="hasMore && showLoadMoreButton"
        ref="loadMoreTrigger"
        class="mt-4 flex flex-col items-center gap-4 text-sm text-slate-400"
      >
        <NuxtButton
          variant="soft"
          color="primary"
          :loading="isLoadingMore"
          @click="emit('load-more')"
        >
          Load more titles
        </NuxtButton>
        <p v-if="isLoadingMore" class="text-xs text-slate-500">
          Fetching more from the stacks…
        </p>
      </div>
    </slot>
  </div>
</template>
