<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-semibold text-white">Library dashboard</h1>
      <p class="text-sm text-slate-400">
        Welcome back! Choose a workspace mode from the sidebar to manage catalog items or circulation.
      </p>
    </header>

    <section class="rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-lg">
      <h2 class="text-lg font-semibold text-white">Catalog overview</h2>
      <p class="mt-2 text-sm text-slate-400">
        The staff catalog grid will live here. For now, use the sidebar to explore the in-progress tools.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
const requiresAuth = import.meta.dev ? false : true;

definePageMeta({
  layout: 'dashboard',
  pageTransition: false,
  requiresAuth,
});
</script>
