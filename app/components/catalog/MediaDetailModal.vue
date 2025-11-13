<script setup lang="ts">
import { computed } from 'vue'
import type { MediaDetail } from '~/composables/useMediaDetail'

const MEDIA_TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  video: 'Video',
  audio: 'Audio',
  other: 'Other',
}

function formatLabel(raw: string) {
  return raw
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  if (Array.isArray(value)) {
    const compact = value
      .map((item) => formatValue(item))
      .filter((item): item is string => Boolean(item && item.trim()))

    return compact.length ? compact.join(', ') : null
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => {
        const formatted = formatValue(nested)
        if (!formatted) {
          return null
        }

        return `${formatLabel(key)}: ${formatted}`
      })
      .filter((entry): entry is string => Boolean(entry))

    if (entries.length) {
      return entries.join(', ')
    }

    return null
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  const text = String(value).trim()
  return text.length ? text : null
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

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
const summaryText = computed(() => media.value?.summary ?? media.value?.description ?? null)
const title = computed(() => media.value?.title ?? 'Item details')
const description = computed(() => {
  if (summaryText.value) {
    return summaryText.value
  }

  if (media.value?.author) {
    return `By ${media.value.author}`
  }

  return 'Select a title to review availability and reservation options.'
})
const mediaTypeLabel = computed(() => {
  const type = media.value?.mediaType
  if (!type) {
    return null
  }

  return MEDIA_TYPE_LABELS[type] ?? formatLabel(type)
})
const subjects = computed(() =>
  (media.value?.subjects ?? [])
    .map((subject) => (typeof subject === 'string' ? subject.trim() : ''))
    .filter((subject): subject is string => Boolean(subject))
)
const detailRows = computed(() => {
  if (!media.value) {
    return [] as Array<{ label: string; value: string }>
  }

  const rows: Array<{ label: string; value: string }> = []

  if (mediaTypeLabel.value) {
    rows.push({ label: 'Type', value: mediaTypeLabel.value })
  }

  if (media.value.mediaFormat) {
    rows.push({ label: 'Format', value: media.value.mediaFormat })
  }

  const published = formatDate(media.value.publishedAt ?? null)
  if (published) {
    rows.push({ label: 'Published', value: published })
  }

  const metadata = media.value.metadata ?? {}
  for (const [key, raw] of Object.entries(metadata)) {
    const formatted = formatValue(raw)
    if (!formatted) {
      continue
    }

    rows.push({ label: formatLabel(key), value: formatted })
  }

  return rows
})
const availabilityRows = computed(() => {
  const availability = media.value?.availability
  if (!availability) {
    return [] as Array<{ label: string; value: string }>
  }

  const rows: Array<{ label: string; value: string }> = []

  if (typeof availability.availableCopies === 'number') {
    rows.push({ label: 'Available copies', value: availability.availableCopies.toString() })
  }

  if (typeof availability.totalCopies === 'number') {
    rows.push({ label: 'Total copies', value: availability.totalCopies.toString() })
  }

  if (typeof availability.holdsPlaced === 'number') {
    rows.push({ label: 'Holds placed', value: availability.holdsPlaced.toString() })
  }

  if (Array.isArray(availability.branches)) {
    const branches = availability.branches
      .map((branch) => (typeof branch === 'string' ? branch.trim() : ''))
      .filter((branch): branch is string => Boolean(branch))

    if (branches.length) {
      rows.push({ label: 'Pickup locations', value: branches.join(', ') })
    }
  }

  return rows
})
</script>

<template>
  <NuxtModal
    v-model:open="openProxy"
    :title="title"
    :description="description"
    :overlay="true"
    :prevent-close="loading"
    class="max-w-4xl"
  >
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
            <div v-if="media" class="grid gap-6 md:grid-cols-[minmax(0,220px)_1fr]">
              <div class="space-y-4">
                <div class="overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 shadow-lg">
                  <NuxtImg
                    v-if="media.coverUrl"
                    :src="media.coverUrl"
                    alt=""
                    class="h-full w-full object-cover"
                    sizes="(min-width: 768px) 220px, 80vw"
                    loading="lazy"
                  />
                  <div
                    v-else
                    class="flex h-full min-h-[300px] items-center justify-center bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 text-xs uppercase tracking-widest text-slate-500"
                  >
                    No cover available
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <NuxtBadge v-if="mediaTypeLabel" color="primary" variant="soft">
                    {{ mediaTypeLabel }}
                  </NuxtBadge>
                  <NuxtBadge v-if="media.mediaFormat" color="neutral" variant="outline">
                    {{ media.mediaFormat }}
                  </NuxtBadge>
                </div>
              </div>

              <div class="space-y-6">
                <div class="space-y-2">
                  <h3 class="text-2xl font-semibold leading-tight text-white">
                    {{ media.title }}
                  </h3>
                  <p v-if="media.author" class="text-sm text-slate-400">
                    By {{ media.author }}
                  </p>
                  <p v-if="summaryText" class="text-sm leading-relaxed text-slate-300">
                    {{ summaryText }}
                  </p>
                  <p v-else class="text-sm text-slate-500">
                    No summary provided yet.
                  </p>
                </div>

                <div v-if="subjects.length" class="flex flex-wrap gap-2">
                  <NuxtBadge
                    v-for="subject in subjects"
                    :key="subject"
                    variant="outline"
                    color="neutral"
                    class="tracking-wide"
                  >
                    {{ subject }}
                  </NuxtBadge>
                </div>

                <section v-if="detailRows.length" class="space-y-3">
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Details
                  </h4>
                  <dl class="grid gap-3 sm:grid-cols-2">
                    <div
                      v-for="row in detailRows"
                      :key="row.label"
                      class="rounded-lg border border-white/5 bg-slate-900/60 p-3"
                    >
                      <dt class="text-xs uppercase tracking-wide text-slate-500">
                        {{ row.label }}
                      </dt>
                      <dd class="mt-1 text-sm text-slate-100">
                        {{ row.value }}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section v-if="availabilityRows.length" class="space-y-3">
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Availability
                  </h4>
                  <dl class="grid gap-3 sm:grid-cols-2">
                    <div
                      v-for="row in availabilityRows"
                      :key="row.label"
                      class="rounded-lg border border-white/5 bg-slate-900/60 p-3"
                    >
                      <dt class="text-xs uppercase tracking-wide text-slate-500">
                        {{ row.label }}
                      </dt>
                      <dd class="mt-1 text-sm text-slate-100">
                        {{ row.value }}
                      </dd>
                    </div>
                  </dl>
                </section>
                <p v-else-if="media.availability" class="text-xs text-slate-500">
                  Additional availability details coming soon.
                </p>
              </div>
            </div>
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
