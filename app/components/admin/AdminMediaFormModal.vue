<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { AdminMediaItem } from '~/composables/useAdminMediaData'
import type { AdminMediaFormMode, AdminMediaFormPayload } from '~/types/admin-media'

const MEDIA_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Book', value: 'book' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Other', value: 'other' },
]

const MEDIA_FORMAT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Print', value: 'print' },
  { label: 'eBook', value: 'ebook' },
  { label: 'Audiobook', value: 'audiobook' },
  { label: 'DVD', value: 'dvd' },
  { label: 'Blu-ray', value: 'blu-ray' },
]

interface AdminMediaFormState {
  title: string
  creator: string
  mediaType: string
  mediaFormat: string
  isbn: string
  genre: string
  subject: string
  description: string
  coverUrl: string
  language: string
  pages: string
  durationSeconds: string
  publishedAt: string
}

const props = withDefaults(
  defineProps<{
    open?: boolean
    mode?: AdminMediaFormMode
    initialValue?: AdminMediaItem | null
    loading?: boolean
    error?: string | null
  }>(),
  {
    open: false,
    mode: 'edit' as AdminMediaFormMode,
    initialValue: null,
    loading: false,
    error: null,
  },
)

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'submit', payload: AdminMediaFormPayload): void
}>()

function createEmptyForm(): AdminMediaFormState {
  return {
    title: '',
    creator: '',
    mediaType: 'book',
    mediaFormat: 'print',
    isbn: '',
    genre: '',
    subject: '',
    description: '',
    coverUrl: '',
    language: '',
    pages: '',
    durationSeconds: '',
    publishedAt: '',
  }
}

const form = reactive<AdminMediaFormState>(createEmptyForm())
const baseline = reactive<AdminMediaFormState>(createEmptyForm())
const formFields = [
  'title',
  'creator',
  'mediaType',
  'mediaFormat',
  'isbn',
  'genre',
  'subject',
  'description',
  'coverUrl',
  'language',
  'pages',
  'durationSeconds',
  'publishedAt',
] as const

function syncBaseline() {
  for (const key of formFields) {
    baseline[key] = form[key]
  }
}

const openProxy = computed({
  get: () => props.open,
  set: (value: boolean) => {
    if (!value) {
      emit('close')
    }
  },
})

const title = computed(() => (props.mode === 'edit' ? 'Edit media item' : 'Add new media'))
const description = computed(() =>
  props.mode === 'edit'
    ? 'Update catalog details and save your changes.'
    : 'Fill in the catalog details for the new title.',
)
const submitLabel = computed(() => (props.mode === 'edit' ? 'Save changes' : 'Create media'))

const requiredFields = computed(() => ({
  title: form.title.trim().length > 0,
  creator: form.creator.trim().length > 0,
  mediaType: form.mediaType.trim().length > 0,
  mediaFormat: form.mediaFormat.trim().length > 0,
}))

const missingFields = computed(() =>
  Object.entries(requiredFields.value)
    .filter(([, valid]) => !valid)
    .map(([field]) => field),
)

const hasValidationErrors = computed(() => missingFields.value.length > 0)
const isSubmitDisabled = computed(() => props.loading || hasValidationErrors.value)

function toNullableString(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed.length) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function assignFromInitial(item: AdminMediaItem | null) {
  if (!item) {
    Object.assign(form, createEmptyForm())
    syncBaseline()
    return
  }

  form.title = item.title ?? ''
  form.creator = item.author ?? ''
  form.mediaType = item.mediaType ?? 'book'
  form.mediaFormat = item.mediaFormat ?? 'print'
  form.isbn = item.isbn ?? ''
  form.genre = item.genre ?? ''
  form.subject = item.subject ?? ''
  form.description = item.description ?? ''
  form.coverUrl = item.coverUrl ?? ''
  form.language = item.language ?? ''
  form.pages = item.pages != null ? String(item.pages) : ''
  form.durationSeconds = item.durationSeconds != null ? String(item.durationSeconds) : ''
  form.publishedAt = item.publishedAt ?? ''
  syncBaseline()
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  syncBaseline()
}

watch(
  () => props.initialValue,
  (value) => {
    assignFromInitial(value)
  },
  { immediate: true },
)

watch(
  () => props.open,
  (open) => {
    if (!open) {
      resetForm()
    }
  },
)

function handleSubmit() {
  const payload: AdminMediaFormPayload = {
    title: form.title.trim(),
    creator: form.creator.trim(),
    mediaType: form.mediaType.trim(),
    mediaFormat: form.mediaFormat.trim(),
    isbn: toNullableString(form.isbn),
    genre: toNullableString(form.genre),
    subject: toNullableString(form.subject),
    description: toNullableString(form.description),
    coverUrl: toNullableString(form.coverUrl),
    language: toNullableString(form.language),
    pages: toNullableNumber(form.pages),
    durationSeconds: toNullableNumber(form.durationSeconds),
    publishedAt: toNullableString(form.publishedAt),
  }

  emit('submit', payload)
}

const isDirty = computed(() => formFields.some((key) => form[key] !== baseline[key]))

defineExpose({
  isDirty,
  hasChanges: () => isDirty.value,
  resetForm,
})
</script>

<template>
  <NuxtModal
    v-model:open="openProxy"
    :title="title"
    :description="description"
    :overlay="true"
    :prevent-close="loading"
    class="max-w-3xl"
  >
    <template #body>
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
          {{ error }}
        </div>

        <div v-if="hasValidationErrors" class="rounded-lg border border-amber-500/40 bg-amber-900/30 p-3 text-xs text-amber-100">
          Missing required fields: {{ missingFields.join(', ') }}
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-title">
              Title
            </label>
            <NuxtInput
              id="admin-media-title"
              v-model="form.title"
              placeholder="Item title"
              required
              :disabled="loading"
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-author">
              Creator / Author
            </label>
            <NuxtInput
              id="admin-media-author"
              v-model="form.creator"
              placeholder="Primary creator"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-type">
              Media type
            </label>
            <select
              id="admin-media-type"
              v-model="form.mediaType"
              class="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:border-primary-500 focus:outline-none"
              :disabled="loading"
            >
              <option v-for="option in MEDIA_TYPE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-format">
              Media format
            </label>
            <select
              id="admin-media-format"
              v-model="form.mediaFormat"
              class="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:border-primary-500 focus:outline-none"
              :disabled="loading"
            >
              <option v-for="option in MEDIA_FORMAT_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-isbn">
              ISBN
            </label>
            <NuxtInput
              id="admin-media-isbn"
              v-model="form.isbn"
              placeholder="Optional"
              :disabled="loading"
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-language">
              Language
            </label>
            <NuxtInput
              id="admin-media-language"
              v-model="form.language"
              placeholder="English, Spanish, etc."
              :disabled="loading"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-genre">
              Genre
            </label>
            <NuxtInput id="admin-media-genre" v-model="form.genre" placeholder="Optional" :disabled="loading" />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-subject">
              Subject / Tags
            </label>
            <NuxtInput
              id="admin-media-subject"
              v-model="form.subject"
              placeholder="Optional"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-pages">
              Page count
            </label>
            <NuxtInput
              id="admin-media-pages"
              v-model="form.pages"
              placeholder="e.g. 320"
              inputmode="numeric"
              :disabled="loading"
            />
          </div>

          <div class="space-y-2">
            <label
              class="text-xs font-semibold uppercase tracking-wide text-slate-400"
              for="admin-media-duration"
            >
              Duration (seconds)
            </label>
            <NuxtInput
              id="admin-media-duration"
              v-model="form.durationSeconds"
              placeholder="e.g. 5400"
              inputmode="numeric"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-cover">
              Cover URL
            </label>
            <NuxtInput
              id="admin-media-cover"
              v-model="form.coverUrl"
              placeholder="https://..."
              :disabled="loading"
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-published">
              Published date
            </label>
            <NuxtInput
              id="admin-media-published"
              v-model="form.publishedAt"
              placeholder="YYYY-MM-DD"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-400" for="admin-media-description">
            Description
          </label>
          <NuxtTextarea
            id="admin-media-description"
            v-model="form.description"
            placeholder="Share a summary or highlight key details."
            min-rows="3"
            :disabled="loading"
          />
        </div>

        <div class="flex justify-end gap-2">
          <NuxtButton type="button" variant="ghost" color="neutral" :disabled="loading" @click="emit('close')">
            Cancel
          </NuxtButton>
          <NuxtButton type="submit" color="primary" :loading="loading" :disabled="isSubmitDisabled">
            {{ submitLabel }}
          </NuxtButton>
        </div>
      </form>
    </template>
  </NuxtModal>
</template>
