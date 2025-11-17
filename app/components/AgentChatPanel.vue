<template>
  <NuxtCard class="flex w-full min-h-[480px] max-h-[70vh] flex-col overflow-y-auto md:max-h-[720px] md:overflow-hidden">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Library AI Concierge
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Describe what you need and we’ll surface great picks.
          </p>
        </div>
        <NuxtBadge :color="badgeColor" variant="soft">{{ badgeLabel }}</NuxtBadge>
      </div>
    </template>

  <div class="flex flex-1 flex-col overflow-visible md:overflow-hidden">
      <div class="grid h-full flex-1 min-h-0 gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <section class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref="messageScrollEl"
            class="flex-1 overflow-y-auto rounded-xl border border-gray-200/60 bg-white p-4 shadow-sm transition-[max-height] dark:border-gray-800/60 dark:bg-slate-900 dark:text-gray-100"
            style="max-height: clamp(250px, 48vh, 415px);"
          >
            <div class="space-y-4">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="[
                  'max-w-prose rounded-xl px-4 py-3 text-sm shadow-sm',
                  message.role === 'user'
                    ? 'ml-auto border border-emerald-400/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-50 dark:bg-emerald-500/10'
                    : 'mr-auto bg-slate-100 text-gray-900 dark:bg-slate-800 dark:text-gray-100',
                ]"
              >
                <p v-if="message.heading" class="font-medium">
                  {{ message.heading }}
                </p>
                <p class="whitespace-pre-wrap leading-relaxed">
                  {{ message.content }}
                </p>
                <p class="mt-1 text-xs opacity-80">{{ message.description }}</p>
              </div>
            </div>
          </div>

          <div class="mt-4 space-y-3">
            <label class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400" for="chat-prompt">
              What can we help you discover?
            </label>
            <textarea
              id="chat-prompt"
              v-model="promptText"
              class="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 disabled:opacity-70 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:border-primary-500"
              placeholder="Ask for book club picks, STEM resources, or anything else…"
              :disabled="chat.isStreaming.value"
              @keydown="handlePromptKeydown"
            />
            <div class="flex flex-wrap items-center gap-2">
              <NuxtButton
                color="primary"
                :loading="chat.isStreaming.value"
                :disabled="!canSubmit"
                icon="i-heroicons-paper-airplane"
                @click="handleSubmit"
              >
                Send
              </NuxtButton>
              <NuxtButton
                v-if="chat.isStreaming.value"
                color="neutral"
                variant="soft"
                icon="i-heroicons-stop-circle"
                @click="chat.cancel"
              >
                Stop
              </NuxtButton>
            </div>
          </div>

          <NuxtAlert
            v-if="hasError"
            class="mt-4"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            :title="errorMessage"
          >
            <template #description>
              Please try again in a moment. If the problem persists, confirm your session is active.
            </template>
            <template #actions>
              <NuxtButton color="error" variant="soft" size="xs" @click="retryLastPrompt">Retry</NuxtButton>
            </template>
          </NuxtAlert>
        </section>

  <aside class="flex min-h-0 flex-col space-y-3 overflow-hidden">
          <header class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Suggested titles
            </h3>
            <NuxtTooltip :text="tooltipLabel">
              <NuxtIcon name="i-heroicons-sparkles" class="text-primary-500" />
            </NuxtTooltip>
          </header>

          <div class="flex h-full flex-col gap-3 overflow-y-auto pr-1" style="max-height: clamp(240px, 55vh, 520px)">
            <template v-if="showSkeletons">
              <NuxtSkeleton v-for="index in 3" :key="`skeleton-${index}`" class="h-24 w-full" />
            </template>

            <template v-else-if="hasItems">
              <NuxtCard
                v-for="item in recommendations"
                :key="item.id"
                variant="soft"
                class="shadow-none"
              >
                <div class="flex items-start gap-3">
                  <div class="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
                    <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" class="h-full w-full object-cover">
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-xs text-gray-500 dark:text-gray-400"
                    >
                      {{ item.mediaType.toUpperCase() }}
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div>
                      <h4 class="text-sm font-medium leading-tight text-gray-900 dark:text-gray-100">
                        {{ item.title }}
                      </h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.author }}</p>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <NuxtBadge size="xs" color="neutral" variant="soft">{{ item.mediaFormat }}</NuxtBadge>
                      <NuxtBadge v-if="item.publishedAt" size="xs" color="neutral" variant="soft">
                        {{ item.publishedAt.slice(0, 4) }}
                      </NuxtBadge>
                      <NuxtBadge
                        v-for="subject in item.subjects"
                        :key="subject"
                        size="xs"
                        color="primary"
                        variant="soft"
                      >
                        {{ subject }}
                      </NuxtBadge>
                    </div>
                    <p v-if="item.description" class="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {{ item.description }}
                    </p>
                  </div>
                </div>
              </NuxtCard>
            </template>

            <template v-else>
              <p class="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Your recommendations will appear here.
              </p>
            </template>
          </div>
        </aside>
      </div>
    </div>
  </NuxtCard>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from '#imports'
import { useAgentChat } from '../composables/useAgentChat'

const chat = useAgentChat()

const promptText = ref('')
const messageScrollEl = ref<HTMLElement | null>(null)
const greetingText = ref('Hi')

function scrollToBottom() {
  const el = messageScrollEl.value
  if (!el) {
    return
  }
  el.scrollTop = el.scrollHeight
}

function updateGreeting() {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 12) {
    greetingText.value = 'Good morning'
  } else if (hour >= 12 && hour < 18) {
    greetingText.value = 'Good afternoon'
  } else {
    greetingText.value = 'Good evening'
  }
}

onMounted(() => {
  nextTick(scrollToBottom)
  updateGreeting()
})

const previewRecommendations = [
  {
    id: 'rec-1',
    title: 'The Silver Arrow',
    author: 'Lev Grossman',
    mediaType: 'book',
    mediaFormat: 'Hardcover',
    coverUrl: null,
    subjects: ['Adventure', 'Friendship'],
    description: 'A whimsical middle-grade adventure that celebrates courage, curiosity, and conservation.',
    publishedAt: '2020-09-15',
  },
  {
    id: 'rec-2',
    title: 'Lalani of the Distant Sea',
    author: 'Erin Entrada Kelly',
    mediaType: 'book',
    mediaFormat: 'Paperback',
    coverUrl: null,
    subjects: ['Fantasy', 'Courage'],
    description: 'A lyrical fantasy about a brave girl who voyages beyond her island to rewrite her village’s fate.',
    publishedAt: '2019-09-03',
  },
]

const handleSubmit = async () => {
  if (!promptText.value.trim() || chat.isStreaming.value) {
    return
  }

  const currentPrompt = promptText.value.trim()
  promptText.value = ''

  await chat.sendPrompt(currentPrompt)
}

function handlePromptKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void handleSubmit()
    return
  }

  if (event.key === 'Enter' && event.shiftKey) {
    event.stopPropagation()
    return
  }
}

const messages = computed(() => {
  const data = [] as Array<{
    id: string
    role: 'user' | 'assistant'
    heading?: string
    description: string
    content: string
  }>

  const lastPromptValue = chat.lastPrompt.value
  const summaryValue = chat.summary.value

  if (lastPromptValue) {
    data.push({
      id: 'user-latest',
      role: 'user',
      heading: 'You',
      description: 'Prompt',
      content: lastPromptValue,
    })
  }

  if (summaryValue) {
    data.push({
      id: 'assistant-latest',
      role: 'assistant',
      heading: 'Library Concierge',
      description: chat.isStreaming.value ? 'Streaming…' : 'Response',
      content: summaryValue,
    })
  } else if (chat.isStreaming.value) {
    data.push({
      id: 'assistant-typing',
      role: 'assistant',
      heading: 'Library Concierge',
      description: 'Streaming…',
      content: 'Preparing recommendations…',
    })
  }

  if (!data.length) {
    data.push({
      id: 'placeholder',
      role: 'assistant',
      heading: 'Library AI Concierge',
      description: 'Tip',
      content: `${greetingText.value}!  Please ask me anything you'd like to know about our books and media!`,
    })
  }

  return data
})

watch(
  () => [messages.value.length, chat.isStreaming.value, chat.summary.value],
  () => {
    void nextTick(scrollToBottom)
  }
)

const recommendations = computed(() => {
  const metadata = chat.metadata.value
  if (metadata?.items?.length) {
    return metadata.items
  }

  return previewRecommendations
})

const hasItems = computed(() => Boolean(chat.metadata.value?.items?.length))

const showSkeletons = computed(() => {
  return Boolean(chat.isStreaming.value && chat.lastPrompt.value && !hasItems.value)
})

const hasError = computed(() => Boolean(chat.error.value))
const errorMessage = computed(() => chat.error.value ?? '')

const tooltipLabel = computed(() =>
  chat.isStreaming.value ? 'Finding titles for you…' : 'Streaming summary coming in Step 2'
)

const canSubmit = computed(() => Boolean(promptText.value.trim()) && !chat.isStreaming.value)

const badgeLabel = computed(() => {
  if (chat.isStreaming.value) {
    return 'Streaming'
  }
  const metadata = chat.metadata.value
  if (metadata?.user.role) {
    return metadata.user.role
  }
  return 'Ready'
})

const badgeColor = computed(() => {
  if (chat.isStreaming.value) {
    return 'primary'
  }
  if (chat.error.value) {
    return 'error'
  }
  return 'neutral'
})

const retryLastPrompt = async () => {
  const lastPromptValue = chat.lastPrompt.value
  if (!lastPromptValue) {
    return
  }
  await chat.sendPrompt(lastPromptValue)
}
</script>
