<script setup lang="ts">
const route = useRoute()
const redirectTo = computed(() => route.query.redirect as string | undefined)
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <h1 class="text-3xl font-semibold text-cyan-200">Sign in to continue</h1>
    <p class="text-sm text-slate-300/80">
      We use magic links powered by Supabase. Enter your email below to receive a one-time sign-in link.
    </p>

    <div v-if="redirectTo" class="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-4 text-sm text-cyan-100">
      After signing in you'll be redirected to <span class="font-semibold">{{ redirectTo }}</span>.
    </div>

    <AuthPanel />
  </div>
</template>
