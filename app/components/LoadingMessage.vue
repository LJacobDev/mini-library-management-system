<template>
  <span
    class="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-cyan-100 backdrop-blur"
  >
    <slot>Loading</slot>
    <LoadingPings />
  </span>
</template>
