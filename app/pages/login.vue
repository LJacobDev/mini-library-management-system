<script setup lang="ts">
const { user } = useSupabaseAuth()

if (import.meta.client) {
  if (user.value) {
    navigateTo('/', { replace: true })
  }

  watch(
    () => user.value,
    (current) => {
      if (current) {
        navigateTo('/', { replace: true })
      }
    },
    { immediate: false }
  )
}
</script>

<template>
  <section class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-16">
    <div class="max-w-lg space-y-6 w-full sm:w-full md:w-auto">
      <AuthPanel />
    </div>
  </section>
</template>
