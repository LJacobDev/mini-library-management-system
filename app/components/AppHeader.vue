<template>
  <header
    class="sticky top-0 z-30 border-b border-white/5 bg-slate-950/90 backdrop-blur"
  >
    <div
      class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        @click="handleHomeClick"
      >
        <span
          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/90 text-slate-950"
        >
          GL
        </span>
        <span>Great City Community Library</span>
      </NuxtLink>

      <div class="flex items-center gap-4">
        <slot name="nav" />
        <NuxtLink
          to="/login"
          class="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Log in
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute();

function handleHomeClick(event: MouseEvent) {
  if (route.path !== "/") {
    return;
  }

  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>
