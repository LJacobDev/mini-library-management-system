<template>
  <div
    class="rounded-3xl bg-linear-to-r from-emerald-500 via-cyan-500 to-sky-500 p-[3px] shadow-2xl shadow-cyan-500/30 "
  >
    <div
      class="flex flex-col items-center gap-2 rounded-[calc(var(--radius-3xl)-3px)] bg-slate-950/95 px-6 py-6 text-center text-white space-y-2"
    >
      <p class="text-xs uppercase tracking-[0.6em] text-cyan-200/80">
        <slot>Checking Status</slot>
      </p>
      <template v-if="errorMessage">
        <p class="text-sm text-rose-300/90">{{ errorMessage }}</p>
      </template>
      <template v-else>
        <p v-if="streamMessage" class="text-sm text-cyan-100/90">
          {{ streamMessage }}
        </p>
        <LoadingMessage v-else-if="showLoading">
          {{ props.loadingMessage }}
        </LoadingMessage>
        <p v-else class="text-sm text-cyan-100/70">
          Awaiting response…
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingMessage from "./LoadingMessage.vue";

const props = defineProps<{
  loadingMessage?: string,
  serviceUrl: string,
}>()

const { message, error, isLoading } = useAiStream(() => props.serviceUrl);

const streamMessage = computed(() => message.value.trim());

const showLoading = computed(() => isLoading.value && streamMessage.value.length === 0);

const errorMessage = computed(() => (!isLoading.value ? error.value : null));
</script>
