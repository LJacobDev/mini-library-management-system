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
      <p v-if="backendMessage">{{ backendMessage }}</p>
      <LoadingMessage v-else >{{ props.loadingMessage }}</LoadingMessage>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingMessage from "./LoadingMessage.vue";

const props = defineProps<{
  loadingMessage?: string
}>()

const backendMessage = ref("");

onMounted(async () => {
  try {
    const response = await $fetch<{ message?: string }>("/api/ai/recommend");
    backendMessage.value = response?.message ?? JSON.stringify(response);
  } catch (error) {
    console.error("Failed to fetch backend message", error);
    backendMessage.value = "Failed to fetch backend message.";
  }
});
</script>
