
<template>
  <div class="min-h-screen bg-slate-950 p-10 text-slate-100">
    <NuxtRouteAnnouncer />
    <div class="mx-auto max-w-3xl space-y-8">
      <h1 class="text-4xl font-extrabold tracking-tight text-cyan-200">
        Mini Library Management System
      </h1>
      <div
        class="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-6 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10"
      >
        <p class="mb-2 text-xs uppercase tracking-[0.5em] text-cyan-300/70">
          Backend Hello Check
        </p>
        <p>{{ backendMessage }}</p>
      </div>
      <!-- <TailwindStatus /> -->
      <OpenAIStatus />
    </div>
  </div>
</template>

<script setup lang="ts">
const backendMessage = ref('Fetching backend message...')

onMounted(async () => {
  try {
    const response = await $fetch<{ message?: string }>(
      '/api/ai/recommend'
    )
    backendMessage.value = response?.message ?? JSON.stringify(response)
  } catch (error) {
    console.error('Failed to fetch backend message', error)
    backendMessage.value = 'Failed to fetch backend message.'
  }
})
</script>


