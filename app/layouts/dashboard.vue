<script setup lang="ts">
const route = useRoute();

const navItems = [
  { label: 'Dashboard home', to: '/dashboard' },
  { label: 'Library desk', to: '/dashboard/desk' },
  { label: 'Admin tools', to: '/dashboard/admin' },
];

function isActive(path: string) {
  if (path === '/dashboard') {
    return route.path === path;
  }

  return route.path.startsWith(path);
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <AppHeader />

    <div class="flex min-h-[calc(100vh-4rem)]">
      <aside class="hidden w-64 flex-shrink-0 border-r border-white/5 bg-slate-950/80 backdrop-blur md:flex">
        <nav class="flex w-full flex-col gap-1 px-4 py-6 text-sm">
          <span class="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace</span>
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 rounded-lg px-2 py-2 text-slate-300 transition hover:bg-slate-800/60"
            :class="isActive(item.to) ? 'bg-slate-800/80 text-white' : ''"
          >
            <span class="inline-flex size-2 rounded-full bg-cyan-400/80" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </aside>

      <main class="flex-1 overflow-x-hidden">
        <div class="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
