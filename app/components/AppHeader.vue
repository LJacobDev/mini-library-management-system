<template>
  <header
    :class="[
      'sticky top-0 z-30 border-b border-white/5 bg-slate-950/90 backdrop-blur transition-transform duration-300 will-change-transform',
      isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
    ]"
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
const isHeaderHidden = ref(false);
const lastScrollY = ref(0);
const SCROLL_THRESHOLD = 80;

const route = useRoute();

const isHomeRoute = computed(() => route.path === "/");

if (import.meta.client) {
  watch(
    () => route.path,
    () => {
      if (!isHomeRoute.value) {
        isHeaderHidden.value = false;
      }

      lastScrollY.value = window.scrollY;
    },
    { immediate: true }
  );
}

onMounted(() => {
  if (!import.meta.client) {
    return;
  }

  lastScrollY.value = window.scrollY;
  let ticking = false;

  const updateVisibility = () => {
    const currentY = window.scrollY;

    if (!isHomeRoute.value) {
      isHeaderHidden.value = false;
      lastScrollY.value = currentY;
      ticking = false;
      return;
    }

    const delta = currentY - lastScrollY.value;

    if (currentY <= SCROLL_THRESHOLD) {
      isHeaderHidden.value = false;
    } else if (delta > 4) {
      isHeaderHidden.value = true;
    } else if (delta < -4) {
      isHeaderHidden.value = false;
    }

    lastScrollY.value = currentY;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", onScroll);
  });
});

function handleHomeClick(event: MouseEvent) {
  if (route.path !== "/") {
    return;
  }

  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>
