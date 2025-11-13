<template>
  <NuxtPage />
</template>

<script setup lang="ts">
const requiresAuth = import.meta.dev ? false : true;

definePageMeta({
  layout: 'dashboard',
  pageTransition: false,
  requiresAuth,
});
</script>
