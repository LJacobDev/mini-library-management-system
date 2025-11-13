<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold text-white">Admin tools</h1>
      <p class="text-sm text-slate-400">
        Manage catalog records, formats, and metadata. Forms will be connected to the admin media APIs shortly.
      </p>
    </header>

    <section class="rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-lg">
      <p class="text-sm text-slate-400">
        Placeholder admin surface. Soon this area will list media items with create, update, and delete capabilities
        backed by `/api/admin/media` routes.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
});
</script>
