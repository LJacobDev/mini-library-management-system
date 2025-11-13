<script setup lang="ts">
import { computed } from 'vue'
import type { MediaDetail } from '~/composables/useMediaDetail'

const props = withDefaults(
  defineProps<{
    open: boolean
    media?: MediaDetail | null
    loading?: boolean
    error?: string | null
  }>(),
  {
    media: null,
    loading: false,
    error: null,
  },
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const openProxy = computed({
  get: () => props.open,
  set: (value: boolean) => {
    if (!value) {
      emit('close')
    }
  },
})

const media = computed(() => props.media ?? null)
const loading = computed(() => props.loading ?? false)
const error = computed(() => props.error ?? null)
</script>

<template>
  <NuxtModal
    v-model:open="openProxy"
    :overlay="true"
    :prevent-close="loading"
    class="max-w-4xl"
  >
    <template #header>
      <p class="font-semibold text-white">
        {{ media?.title ?? 'Item details' }}
      </p>
    </template>

    <template #body>
      <div class="flex min-h-[200px] flex-col gap-4">
        <p v-if="loading" class="text-sm text-slate-400">
          Loading details…
        </p>

        <p v-else-if="error" class="rounded-md border border-red-500/40 bg-red-900/30 px-3 py-2 text-sm text-red-200">
          {{ error }}
        </p>

        <div v-else class="text-sm text-slate-200">
          <slot name="content">
            <p v-if="media">Details for <strong>{{ media.title }}</strong> will render here.</p>
            <p v-else>No item selected yet.</p>
          </slot>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <slot name="actions">
          <NuxtButton variant="ghost" color="neutral" :disabled="loading" @click="emit('close')">
            Close
          </NuxtButton>
        </slot>
      </div>
    </template>
  </NuxtModal>
</template>
