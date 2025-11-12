<template>
  <NuxtApp>
    <NuxtLoadingIndicator color="var(--color-primary-500)" :height="2" />
    <NuxtRouteAnnouncer />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NuxtApp>
</template>
