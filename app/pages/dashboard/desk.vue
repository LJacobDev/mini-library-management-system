<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold text-white">Library desk</h1>
      <p class="text-sm text-slate-400">
        Start a checkout or mark a return. We’ll wire the live forms next.
      </p>
    </header>

    <section class="rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-lg">
      <p class="text-sm text-slate-400">
        Placeholder screen for circulation actions. Once wired, this panel will host the check-out and check-in
        workflows that hit the `/api/loans` endpoints.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
});
</script>
