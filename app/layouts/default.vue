<script setup lang="ts">
const isAuthOpen = ref(false)
const { user } = useSupabaseAuth()

watch(
  () => user.value,
  (current) => {
    if (current) {
      isAuthOpen.value = false
    }
  }
)

function openAuthPanel() {
  isAuthOpen.value = true
}

function closeAuthPanel() {
  isAuthOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-950"
    >
      Skip to main content
    </a>
    <AppHeader @open-auth="openAuthPanel">
      <template #nav>
        <slot name="nav" />
      </template>
    </AppHeader>

    <main id="main-content">
      <slot />
    </main>

    <ClientOnly>
      <Transition name="fade">
        <div
          v-if="isAuthOpen"
          class="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur"
          @click.self="closeAuthPanel"
        >
          <div class="relative w-full max-w-md">
            <NuxtButton
              size="xs"
              variant="ghost"
              color="neutral"
              class="absolute right-3 top-3 z-10"
              @click="closeAuthPanel"
            >
              Close
            </NuxtButton>
            <AuthPanel />
          </div>
        </div>
      </Transition>
    </ClientOnly>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
