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

        <template v-if="!isAuthenticated">
          <NuxtLink
            to="/login"
            class="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Log in
          </NuxtLink>
        </template>

        <template v-else>
          <details class="relative">
            <summary
              class="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/80 text-xs font-bold uppercase text-slate-950">
                {{ profileInitials }}
              </span>
              <span class="hidden sm:block">{{ profileLabel }}</span>
              <span class="sr-only">Profile menu</span>
            </summary>
            <div
              class="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-lg backdrop-blur"
            >
              <div class="border-b border-white/5 px-4 py-3 text-sm text-slate-200">
                <p class="font-semibold">{{ profileLabel }}</p>
                <p class="truncate text-xs text-slate-400">{{ userEmail }}</p>
              </div>
              <nav class="flex flex-col">
                <NuxtLink
                  to="/account/loans"
                  class="px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800/70"
                >
                  My loans & reservations
                </NuxtLink>
                <NuxtLink
                  to="/account/profile"
                  class="px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800/70"
                >
                  Profile preferences
                </NuxtLink>
                <button
                  type="button"
                  class="px-4 py-2 text-left text-sm text-red-300 transition hover:bg-slate-800/70"
                  @click="handleSignOut"
                >
                  Sign out
                </button>
              </nav>
            </div>
          </details>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, signOut } = useSupabaseAuth();
const isHeaderHidden = ref(false);
const lastScrollY = ref(0);
const SCROLL_THRESHOLD = 80;

const route = useRoute();
const router = useRouter();

const isAuthenticated = computed(() => Boolean(user.value));

const profileLabel = computed(() => {
  const metadataName = user.value?.user_metadata?.full_name || user.value?.user_metadata?.name;
  return metadataName || user.value?.email || "Profile";
});

const profileInitials = computed(() => {
  const label = profileLabel.value;
  if (!label) {
    return "PR";
  }

  const parts = label.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part.charAt(0)).join("");
  return initials.toUpperCase();
});

const userEmail = computed(() => user.value?.email || "");

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

async function handleSignOut() {
  await signOut();
  await router.push("/");
}
</script>
