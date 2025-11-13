import { computed } from 'vue'
import type { CatalogItem, MediaType } from './useCatalogData'

export interface MediaAvailability {
  availableCopies?: number
  totalCopies?: number
  holdsPlaced?: number
  branches?: string[]
}

export interface MediaDetail extends CatalogItem {
  availability?: MediaAvailability
  summary?: string | null
  locationNotes?: string | null
}

interface MediaDetailState {
  isOpen: boolean
  isLoading: boolean
  media: MediaDetail | null
  error: string | null
}

const STATE_KEY = 'media-detail-state'

export function useMediaDetail() {
  const state = useState<MediaDetailState>(STATE_KEY, () => ({
    isOpen: false,
    isLoading: false,
    media: null,
    error: null,
  }))

  const media = computed(() => state.value.media)
  const isOpen = computed(() => state.value.isOpen)
  const isLoading = computed(() => state.value.isLoading)
  const error = computed(() => state.value.error)
  const mediaType = computed<MediaType | undefined>(() => state.value.media?.mediaType)

  function openWithMedia(item: CatalogItem | MediaDetail) {
    state.value.media = {
      ...item,
    }
    state.value.isOpen = true
    state.value.error = null
    state.value.isLoading = false
  }

  async function openWithLoader(id: string, loader: (id: string) => Promise<MediaDetail>) {
    state.value.isLoading = true
    state.value.error = null

    try {
      const detail = await loader(id)
      state.value.media = detail
      state.value.isOpen = true
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Unable to load item details.'
    } finally {
      state.value.isLoading = false
    }
  }

  function close() {
    state.value.isOpen = false
    state.value.isLoading = false
    state.value.error = null
    state.value.media = null
  }

  function setAvailability(availability: MediaAvailability | null | undefined) {
    if (!state.value.media) {
      return
    }

    state.value.media = {
      ...state.value.media,
      availability: availability ?? undefined,
    }
  }

  function setSummary(summary: string | null | undefined) {
    if (!state.value.media) {
      return
    }

    state.value.media = {
      ...state.value.media,
      summary: summary ?? null,
    }
  }

  function resetError() {
    state.value.error = null
  }

  return {
    media,
    mediaType,
    isOpen,
    isLoading,
    error,
    openWithMedia,
    openWithLoader,
    setAvailability,
    setSummary,
    resetError,
    close,
  }
}
