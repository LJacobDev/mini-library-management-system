<script setup lang="ts">
useHead({
  htmlAttrs: {
    class: "dark",
    "data-theme": "dark",
  },
  bodyAttrs: {
    class: "force-dark dark",
    "data-theme": "dark",
  },
})
</script>

<template>
  <NuxtApp>
    <NuxtLoadingIndicator color="var(--color-primary-500)" :height="2" />
    <NuxtRouteAnnouncer />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NuxtApp>
</template>
