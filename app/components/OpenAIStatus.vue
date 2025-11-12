<template>
  <div
    class="rounded-3xl bg-linear-to-r from-emerald-500 via-cyan-500 to-sky-500 p-[3px] shadow-2xl shadow-cyan-500/30"
  >
    <div
      class="flex flex-col items-center gap-2 rounded-[calc(var(--radius-3xl)-3px)] bg-slate-950/95 px-8 py-6 text-center text-white"
    >
      <p class="text-xs uppercase tracking-[0.6em] text-cyan-200/80">
        OpenAI Status Check
      </p>
      <LoadingMessage>Checking OpenAI API Status</LoadingMessage>
    </div>
  </div>
</template>
