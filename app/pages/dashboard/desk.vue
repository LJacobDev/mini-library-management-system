<template>
  <div class="space-y-8">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold text-white">Library desk</h1>
      <p class="text-sm text-slate-400">
        Look up an item, then open its circulation panel to check it out or mark it returned.
      </p>
    </header>

    <section class="space-y-5 rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-lg">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <NuxtInput
          v-model="searchTerm"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search by ISBN, title, author, or keyword"
          size="md"
          class="w-full md:w-96"
        />

        <div class="flex items-center gap-3 text-sm text-slate-400">
          <span v-if="isSearching" class="flex items-center gap-2 text-cyan-300">
            <span class="inline-flex size-2 animate-ping rounded-full bg-cyan-400" />
            Searching catalog…
          </span>
          <span v-else>
            {{ totalResults }} result{{ totalResults === 1 ? '' : 's' }}
          </span>
        </div>
      </div>

      <p v-if="searchError" class="rounded-lg border border-red-500/40 bg-red-900/30 px-4 py-3 text-sm text-red-200">
  Couldn’t search the catalog just now.
  <button type="button" class="underline" @click="retrySearch">Retry</button>
      </p>

      <div v-else>
        <div
          v-if="!isSearching && !catalogItems.length"
          class="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 py-14 text-center text-sm text-slate-400"
        >
          <span>No items match that search yet.</span>
          <span class="text-xs uppercase tracking-wide text-slate-500">Try another keyword or ISBN</span>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="item in catalogItems"
            :key="item.id"
            type="button"
            class="group flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/70 p-4 text-left transition hover:border-cyan-400/60 hover:bg-slate-900/80"
            @click="openItem(item)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-white group-hover:text-cyan-200">
                  {{ item.title }}
                </h3>
                <p v-if="item.author" class="text-xs uppercase tracking-wide text-slate-500">
                  {{ item.author }}
                </p>
              </div>
              <NuxtBadge :color="statusBadge(item).color" :variant="statusBadge(item).variant">
                {{ statusBadge(item).label }}
              </NuxtBadge>
            </div>

            <p v-if="item.description" class="mt-3 line-clamp-3 text-sm text-slate-400">
              {{ item.description }}
            </p>

            <div class="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span v-if="item.mediaType" class="rounded-full bg-slate-900/80 px-3 py-1 text-slate-300">
                {{ item.mediaType }}
              </span>
              <span v-for="subject in (item.subjects || [])" :key="subject" class="rounded-full bg-slate-900/80 px-3 py-1">
                {{ subject }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>

    <ClientOnly>
      <NuxtModal
        v-model:open="isModalOpen"
        :title="modalTitle"
        :description="modalDescription"
        :prevent-close="isSubmitting"
        class="max-w-2xl"
      >
        <template #body>
          <div class="space-y-4 text-sm text-slate-200">
            <p v-if="activeItem">
              <strong>{{ activeItem.title }}</strong>
              <span v-if="activeItem.author" class="text-slate-400"> by {{ activeItem.author }}</span>
            </p>

            <div v-if="formMessage" :class="feedbackClasses" class="rounded-lg border px-3 py-2">
              {{ formMessage }}
            </div>

            <form v-if="isCheckoutMode" class="space-y-4" @submit.prevent="submitCheckout">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Member email or library ID
                <NuxtInput
                  v-model="checkoutForm.patronIdentifier"
                  required
                  placeholder="e.g. patron@example.com or member UUID"
                  class="mt-1"
                  :disabled="isSubmitting"
                />
              </label>

              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Due date</span>
                  <p class="mt-1 text-sm text-slate-200">{{ checkoutDueDate }}</p>
                </div>
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Pickup location</span>
                  <p class="mt-1 text-sm text-slate-200">Main branch circulation</p>
                </div>
              </div>

              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notes for this checkout
                <NuxtTextarea
                  v-model="checkoutForm.notes"
                  placeholder="Optional context, condition notes, etc."
                  class="mt-1"
                  :disabled="isSubmitting"
                />
              </label>

              <div class="flex justify-end gap-2">
                <NuxtButton type="button" variant="ghost" color="neutral" :disabled="isSubmitting" @click="closeModal">
                  Cancel
                </NuxtButton>
                <NuxtButton type="submit" color="primary" :loading="isSubmitting">
                  Queue checkout
                </NuxtButton>
              </div>
            </form>

            <form v-else class="space-y-4" @submit.prevent="submitCheckin">
              <div class="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-300">
                <p class="font-semibold text-slate-200">Current borrower</p>
                <p class="mt-1">{{ borrowerDisplay }}</p>
                <p v-if="loanMetadata?.dueDate" class="mt-1 text-xs uppercase tracking-wide text-amber-300">
                  Due {{ formatDisplayDate(loanMetadata?.dueDate) }}
                </p>
              </div>

              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Return condition / notes
                <NuxtTextarea
                  v-model="checkinForm.notes"
                  placeholder="Add condition notes, damage reports, etc."
                  class="mt-1"
                  :disabled="isSubmitting"
                />
              </label>

              <div class="flex justify-end gap-2">
                <NuxtButton type="button" variant="ghost" color="neutral" :disabled="isSubmitting" @click="closeModal">
                  Cancel
                </NuxtButton>
                <NuxtButton type="submit" color="primary" :loading="isSubmitting">
                  Mark as returned
                </NuxtButton>
              </div>
            </form>
          </div>
        </template>
      </NuxtModal>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FetchError } from 'ofetch'
import type { CatalogItem } from '~/composables/useCatalogData'
import { useDebouncedRef } from '~/composables/useDebouncedRef'

definePageMeta({
  layout: 'dashboard',
  requiresAuth: !import.meta.dev,
})

type DeskLoanMetadata = {
  loanStatus?: string
  loanId?: string
  borrower?: {
    id?: string
    email?: string
    name?: string
  }
  dueDate?: string
}

const PAGE_SIZE = 12

const searchTerm = ref('')
const debouncedSearch = useDebouncedRef(searchTerm, 300)

interface CatalogSearchResponse {
  items: CatalogItem[]
  total: number
}

const { data, pending, error, refresh } = await useAsyncData<CatalogSearchResponse>(
  'desk-catalog-search',
  () =>
    $fetch<CatalogSearchResponse>('/api/catalog', {
      params: {
        page: 1,
        pageSize: PAGE_SIZE,
        q: debouncedSearch.value || undefined,
      },
    }),
  {
    watch: [debouncedSearch],
    default: () => ({ items: [], total: 0 }),
  },
)

const catalogItems = computed(() => data.value?.items ?? [])
const totalResults = computed(() => data.value?.total ?? catalogItems.value.length)
const isSearching = computed(() => pending.value)
const searchError = computed(() => (error.value as Error | null) ?? null)

const isModalOpen = ref(false)
const activeItem = ref<CatalogItem | null>(null)

const checkoutForm = reactive({
  patronIdentifier: '',
  notes: '',
})

const checkinForm = reactive({
  notes: '',
})

const isSubmitting = ref(false)
const formMessage = ref<string | null>(null)
const formStatus = ref<'success' | 'error'>('success')

const loanMetadata = computed<DeskLoanMetadata | null>(() =>
  activeItem.value ? extractLoanMetadata(activeItem.value) : null,
)

const loanStatus = computed(() => (loanMetadata.value?.loanStatus === 'checked_out' ? 'checked_out' : 'available'))
const isCheckoutMode = computed(() => loanStatus.value !== 'checked_out')

const checkoutDueDateIso = computed(() => {
  const raw = loanMetadata.value?.dueDate
  if (raw && !Number.isNaN(Date.parse(raw))) {
    return new Date(raw).toISOString()
  }

  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString()
})

const modalTitle = computed(() => {
  if (!activeItem.value) {
    return 'Circulation'
  }

  return isCheckoutMode.value ? `Check out “${activeItem.value.title}”` : `Check in “${activeItem.value.title}”`
})

const modalDescription = computed(() => {
  if (!activeItem.value) {
    return 'Circulation tools'
  }

  return isCheckoutMode.value
    ? 'Verify the member and confirm checkout details.'
    : 'Review borrower details, add return notes, and complete the check-in.'
})

const checkoutDueDate = computed(() => {
  return formatDisplayDate(checkoutDueDateIso.value)
})

const borrowerDisplay = computed(() => {
  const borrower = loanMetadata.value?.borrower
  if (!borrower) {
    return 'Unknown borrower'
  }

  const pieces = [borrower.name, borrower.email, borrower.id].filter((piece): piece is string => Boolean(piece))
  return pieces.join(' • ') || 'Unknown borrower'
})

const feedbackClasses = computed(() =>
  formStatus.value === 'success'
    ? 'border-emerald-500/40 bg-emerald-900/30 text-emerald-200'
    : 'border-red-500/40 bg-red-900/30 text-red-200',
)

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IDENTIFIER_PATTERN = /^[A-Za-z0-9@._-]{3,120}$/
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/

function stripControlCharacters(input: string) {
  let result = ''
  for (const char of input) {
    const code = char.charCodeAt(0)
    if ((code >= 0 && code <= 31) || code === 127) {
      result += ' '
    } else {
      result += char
    }
  }
  return result
}

function sanitizeNoteInput(value: string, maxLength = 500) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = stripControlCharacters(value.normalize('NFKC'))
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return undefined
  }

  return normalized.slice(0, maxLength)
}

function sanitizeIdentifierInput(raw: string | undefined) {
  if (typeof raw !== 'string') {
    return null
  }

  const normalized = stripControlCharacters(raw).trim()
  if (!normalized) {
    return null
  }

  if (UUID_PATTERN.test(normalized)) {
    return normalized
  }

  const lowered = normalized.toLowerCase()
  if (EMAIL_PATTERN.test(lowered)) {
    return lowered
  }

  const compact = normalized.replace(/[^A-Za-z0-9@._-]/g, '')
  if (!compact || !IDENTIFIER_PATTERN.test(compact)) {
    return null
  }

  return compact
}

function extractLoanMetadata(item: CatalogItem): DeskLoanMetadata {
  const raw = (item.metadata ?? {}) as Record<string, unknown>
  const borrowerRaw = raw.borrower as Record<string, unknown> | undefined

  const borrower = borrowerRaw
    ? {
        id: typeof borrowerRaw.id === 'string' ? borrowerRaw.id : undefined,
        email: typeof borrowerRaw.email === 'string' ? borrowerRaw.email : undefined,
        name: typeof borrowerRaw.name === 'string' ? borrowerRaw.name : undefined,
      }
    : undefined

  return {
    loanStatus: typeof raw.loanStatus === 'string' ? raw.loanStatus : undefined,
    loanId: typeof raw.loanId === 'string' ? raw.loanId : undefined,
    borrower,
    dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : undefined,
  }
}

type StatusBadge = {
  label: string
  color: 'primary' | 'neutral'
  variant: 'soft' | 'subtle'
}

function statusBadge(item: CatalogItem): StatusBadge {
  const status = extractLoanMetadata(item).loanStatus === 'checked_out' ? 'checked_out' : 'available'
  if (status === 'checked_out') {
    return { label: 'Checked out', color: 'neutral', variant: 'soft' }
  }

  return { label: 'Available', color: 'primary', variant: 'subtle' }
}

function openItem(item: CatalogItem) {
  activeItem.value = item
  resetForms()
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  activeItem.value = null
  resetForms()
}

function resetForms() {
  checkoutForm.patronIdentifier = ''
  checkoutForm.notes = ''
  checkinForm.notes = ''
  formMessage.value = null
  formStatus.value = 'success'
}

function retrySearch() {
  return refresh()
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (!error) {
    return fallback
  }

  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  const fetchError = error as FetchError<{ statusMessage?: string; message?: string }>
  const payloadMessage = fetchError?.data?.statusMessage ?? fetchError?.data?.message

  if (payloadMessage) {
    return payloadMessage
  }

  if (fetchError?.message) {
    return fetchError.message
  }

  return fallback
}

async function refreshActiveItem(itemId: string) {
  try {
    await refresh()
    const refreshedItems = data.value?.items ?? []
    const nextItem = refreshedItems.find((item: CatalogItem) => item.id === itemId)
    if (nextItem) {
      activeItem.value = { ...nextItem }
    }
  } catch (err) {
    console.error('Failed to refresh catalog after circulation action', err)
  }
}

function patchCatalogItem(itemId: string, updater: (item: CatalogItem) => CatalogItem) {
  if (!data.value) {
    return
  }

  const nextItems = data.value.items.map((item) => (item.id === itemId ? updater(item) : item))

  data.value = {
    ...data.value,
    items: nextItems,
  }

  if (activeItem.value?.id === itemId) {
    const updated = nextItems.find((item) => item.id === itemId)
    if (updated) {
      activeItem.value = { ...updated }
    }
  }
}

function updateItemMetadata(item: CatalogItem, options: { set?: Record<string, unknown>; remove?: string[] }) {
  const result = new Map<string, unknown>()

  for (const [key, value] of Object.entries(item.metadata ?? {})) {
    if (value !== undefined && value !== null) {
      result.set(key, value)
    }
  }

  if (options.remove) {
    for (const key of options.remove) {
      result.delete(key)
    }
  }

  if (options.set) {
    for (const [key, value] of Object.entries(options.set)) {
      if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
        result.delete(key)
      } else {
        result.set(key, value)
      }
    }
  }

  const normalized = result.size ? Object.fromEntries(result) : undefined
  return {
    ...item,
    metadata: normalized,
  }
}

async function submitCheckout() {
  if (!activeItem.value) {
    return
  }

  const memberIdentifier = sanitizeIdentifierInput(checkoutForm.patronIdentifier)
  if (!memberIdentifier) {
    formStatus.value = 'error'
    formMessage.value = 'Enter a valid member email, card number, or UUID (3-120 characters).'
    return
  }

  const checkoutNote = sanitizeNoteInput(checkoutForm.notes) ?? undefined

  isSubmitting.value = true
  formMessage.value = null

  try {
    const response = await $fetch<{ loan: { id: string; dueDate: string | null } }>('/api/loans', {
      method: 'POST',
      body: {
        memberIdentifier,
        mediaId: activeItem.value.id,
        dueDate: checkoutDueDateIso.value,
        note: checkoutNote,
      },
    })

    const loanId = response.loan.id
    const dueDate = response.loan.dueDate ?? checkoutDueDateIso.value

    await refreshActiveItem(activeItem.value.id)

    if (loanMetadata.value?.loanStatus !== 'checked_out') {
      patchCatalogItem(activeItem.value.id, (item) => {
        const borrowerMeta: Record<string, unknown> = {
          ...(loanMetadata.value?.borrower ?? {}),
          id: memberIdentifier,
        }

        if (memberIdentifier.includes('@')) {
          borrowerMeta.email = memberIdentifier
        }

        return updateItemMetadata(item, {
          set: {
            loanStatus: 'checked_out',
            loanId,
            borrower: borrowerMeta,
            dueDate,
          },
        })
      })
    }

    checkoutForm.patronIdentifier = ''
    checkoutForm.notes = ''
    formStatus.value = 'success'
    formMessage.value = `Checkout complete for “${activeItem.value.title}”.`
  } catch (err) {
    console.error(err)
    formStatus.value = 'error'
    formMessage.value = resolveErrorMessage(err, 'Checkout failed.')
  } finally {
    isSubmitting.value = false
  }
}

async function submitCheckin() {
  if (!activeItem.value) {
    return
  }

  const loanId = loanMetadata.value?.loanId
  if (!loanId) {
    formStatus.value = 'error'
    formMessage.value = 'Missing loan ID for this item. Refresh the search and try again.'
    return
  }

  const conditionNote = sanitizeNoteInput(checkinForm.notes, 300) ?? undefined
  const clerkNote = sanitizeNoteInput(checkinForm.notes) ?? undefined

  isSubmitting.value = true
  formMessage.value = null

  try {
    await $fetch(`/api/loans/${loanId}/return`, {
      method: 'POST',
      body: {
        condition: conditionNote,
        notes: clerkNote,
      },
    })

    await refreshActiveItem(activeItem.value.id)

    if (loanMetadata.value?.loanStatus === 'checked_out') {
      patchCatalogItem(activeItem.value.id, (item) =>
        updateItemMetadata(item, {
          remove: ['loanStatus', 'borrower', 'loanId', 'dueDate'],
        }),
      )
    }

    checkinForm.notes = ''
    formStatus.value = 'success'
    formMessage.value = `Check-in recorded for “${activeItem.value.title}”.`
  } catch (err) {
    console.error(err)
    formStatus.value = 'error'
    formMessage.value = resolveErrorMessage(err, 'Check-in failed.')
  } finally {
    isSubmitting.value = false
  }
}

function formatDisplayDate(value: string | undefined) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

watch(isModalOpen, (open) => {
  if (!open) {
    return
  }

  formMessage.value = null
  formStatus.value = 'success'
})
</script>
