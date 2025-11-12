<template>
  <div
    class="rounded-3xl bg-linear-to-r from-emerald-500 via-cyan-500 to-sky-500 p-[3px] shadow-2xl shadow-cyan-500/30"
  >
    <div
      class="flex flex-col items-center gap-2 rounded-[calc(var(--radius-3xl)-3px)] bg-slate-950/95 px-6 py-6 text-center text-white space-y-2"
    >
      <p class="text-xs uppercase tracking-[0.6em] text-cyan-200/80">
        <slot>Checking Status</slot>
      </p>
      <p v-if="streamError" class="text-sm text-red-300">
        {{ streamError }}
      </p>
      <p v-else-if="incomingMessage" class="text-sm text-cyan-100">
        {{ incomingMessage }}
      </p>
      <LoadingMessage v-else>{{ loadingPlaceholder }}</LoadingMessage>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  loadingMessage?: string
  serviceUrl: string
}>()

const {
  text,
  error,
} = useAiStream({
  url: () => props.serviceUrl,
  autoStart: true,
})

const streamError = computed(() => error.value ?? null)
const incomingMessage = computed(() => text.value.trim())
const loadingPlaceholder = computed(
  () => props.loadingMessage ?? 'Waiting for streaming response'
)
</script>
