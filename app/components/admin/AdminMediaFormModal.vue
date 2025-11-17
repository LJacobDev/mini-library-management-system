<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
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

const MAX_SHORT_TEXT_LENGTH = 256
const MAX_LONG_TEXT_LENGTH = 2000
const MAX_TAG_TEXT_LENGTH = 160
const MAX_LANGUAGE_LENGTH = 64
const MAX_ISBN_LENGTH = 32
const MAX_DATE_LENGTH = 64
const MAX_URL_LENGTH = 1024
const MAX_PAGE_VALUE = 100000
const MAX_DURATION_VALUE = 864000

const allowedMediaTypes = new Set(MEDIA_TYPE_OPTIONS.map((option) => option.value))
const allowedMediaFormats = new Set(MEDIA_FORMAT_OPTIONS.map((option) => option.value))

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

const validationErrors = ref<string[]>([])

function stripControlCharacters(value: string) {
  let result = ''
  for (const char of value) {
    const code = char.charCodeAt(0)
    if ((code >= 0 && code <= 31) || code === 127) {
      result += ' '
    } else {
      result += char
    }
  }
  return result
}

function normalizeText(value: string, maxLength = MAX_SHORT_TEXT_LENGTH) {
  return stripControlCharacters(value.normalize('NFKC'))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function sanitizeRequiredText(value: string, label: string, errors: string[], maxLength = MAX_SHORT_TEXT_LENGTH) {
  const normalized = normalizeText(value, maxLength)
  if (!normalized) {
    errors.push(`${label} is required.`)
    return null
  }

  return normalized
}

function sanitizeOptionalText(value: string, maxLength = MAX_SHORT_TEXT_LENGTH) {
  const normalized = normalizeText(value, maxLength)
  return normalized.length ? normalized : null
}

function sanitizeEnumValue(value: string, label: string, errors: string[], allowed: Set<string>) {
  const normalized = value.trim().toLowerCase()
  if (!allowed.has(normalized)) {
    errors.push(`${label} selection is invalid.`)
    return null
  }

  return normalized
}

function sanitizeOptionalPositiveInteger(value: string, label: string, errors: string[], maxValue: number) {
  const trimmed = value.trim()
  if (!trimmed.length) {
    return null
  }

  if (!/^\d+$/.test(trimmed)) {
    errors.push(`${label} must contain digits only.`)
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    errors.push(`${label} must be a positive whole number.`)
    return null
  }

  if (parsed > maxValue) {
    errors.push(`${label} must be less than ${maxValue.toLocaleString()}.`)
    return null
  }

  return parsed
}

function sanitizeOptionalUrl(value: string, label: string, errors: string[]) {
  const normalized = sanitizeOptionalText(value, MAX_URL_LENGTH)
  if (!normalized) {
    return null
  }

  try {
    const url = new URL(normalized)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Only http/https supported')
    }
    return url.toString()
  } catch {
    errors.push(`${label} must be a valid URL starting with http or https.`)
    return null
  }
}

function sanitizeOptionalDate(value: string, label: string, errors: string[]) {
  const normalized = sanitizeOptionalText(value, MAX_DATE_LENGTH)
  if (!normalized) {
    return null
  }

  const timestamp = Date.parse(normalized)
  if (Number.isNaN(timestamp)) {
    errors.push(`${label} must be a valid date.`)
    return null
  }

  return new Date(timestamp).toISOString()
}

function formatDateForInput(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return ''
  }

  return new Date(timestamp).toISOString().slice(0, 10)
}

function clearValidationErrors() {
  if (validationErrors.value.length) {
    validationErrors.value = []
  }
}

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
  title: Boolean(normalizeText(form.title)),
  creator: Boolean(normalizeText(form.creator)),
  mediaType: allowedMediaTypes.has(form.mediaType?.trim().toLowerCase()),
  mediaFormat: allowedMediaFormats.has(form.mediaFormat?.trim().toLowerCase()),
}))

const missingFields = computed(() =>
  Object.entries(requiredFields.value)
    .filter(([, valid]) => !valid)
    .map(([field]) => field),
)

const hasMissingRequiredFields = computed(() => missingFields.value.length > 0)
const hasValidationErrors = computed(() => hasMissingRequiredFields.value || validationErrors.value.length > 0)
const isSubmitDisabled = computed(() => props.loading || hasValidationErrors.value)

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
  form.publishedAt = formatDateForInput(item.publishedAt)
  syncBaseline()
  clearValidationErrors()
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  syncBaseline()
  clearValidationErrors()
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

watch(
  () => formFields.map((key) => form[key]),
  () => {
    clearValidationErrors()
  },
)

function buildSanitizedPayload(): { payload: AdminMediaFormPayload | null; errors: string[] } {
  const errors: string[] = []

  const title = sanitizeRequiredText(form.title, 'Title', errors)
  const creator = sanitizeRequiredText(form.creator, 'Creator / Author', errors)
  const mediaType = sanitizeEnumValue(form.mediaType, 'Media type', errors, allowedMediaTypes)
  const mediaFormat = sanitizeEnumValue(form.mediaFormat, 'Media format', errors, allowedMediaFormats)

  const isbn = sanitizeOptionalText(form.isbn, MAX_ISBN_LENGTH)
  const genre = sanitizeOptionalText(form.genre, MAX_TAG_TEXT_LENGTH)
  const subject = sanitizeOptionalText(form.subject, MAX_TAG_TEXT_LENGTH)
  const description = sanitizeOptionalText(form.description, MAX_LONG_TEXT_LENGTH)
  const coverUrl = sanitizeOptionalUrl(form.coverUrl, 'Cover URL', errors)
  const language = sanitizeOptionalText(form.language, MAX_LANGUAGE_LENGTH)
  const pages = sanitizeOptionalPositiveInteger(form.pages, 'Page count', errors, MAX_PAGE_VALUE)
  const durationSeconds = sanitizeOptionalPositiveInteger(
    form.durationSeconds,
    'Duration',
    errors,
    MAX_DURATION_VALUE,
  )
  const publishedAt = sanitizeOptionalDate(form.publishedAt, 'Published date', errors)

  if (errors.length || !title || !creator || !mediaType || !mediaFormat) {
    return { payload: null, errors }
  }

  const payload: AdminMediaFormPayload = {
    title,
    creator,
    mediaType,
    mediaFormat,
    isbn,
    genre,
    subject,
    description,
    coverUrl,
    language,
    pages,
    durationSeconds,
    publishedAt,
  }

  return { payload, errors }
}

function handleSubmit() {
  const result = buildSanitizedPayload()
  validationErrors.value = result.errors
  if (!result.payload) {
    return
  }

  emit('submit', result.payload)
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

        <div v-if="hasMissingRequiredFields" class="rounded-lg border border-amber-500/40 bg-amber-900/30 p-3 text-xs text-amber-100">
          Missing required fields: {{ missingFields.join(', ') }}
        </div>

        <div
          v-if="validationErrors.length"
          class="rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-100"
        >
          <p class="font-semibold">Resolve the following before submitting:</p>
          <ul class="mt-2 list-disc space-y-1 pl-5">
            <li v-for="(message, index) in validationErrors" :key="`${message}-${index}`">
              {{ message }}
            </li>
          </ul>
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
