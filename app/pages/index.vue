<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <h1 class="text-4xl font-extrabold tracking-tight text-cyan-200 text-center">
      Mini Library Management System
    </h1>
    <!-- <AuthPanel /> -->
  </div>
</template>

<script setup>
definePageMeta({ ssr: true })
// temporary redirect to /catalog while main page is not yet built
navigateTo('/status')
</script>