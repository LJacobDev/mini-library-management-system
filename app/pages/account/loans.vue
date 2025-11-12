<script setup lang="ts">
definePageMeta({
  requiresAuth: true,
})

const fakeLoans = ref([
  { id: 'LN-001', title: 'The Pragmatic Programmer', dueDate: '2025-11-20' },
  { id: 'LN-002', title: 'Clean Architecture', dueDate: '2025-12-01' },
])
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold text-cyan-200">My Loans</h1>
      <p class="text-sm text-slate-300/80">Placeholder data until the real dashboard is wired up.</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div
        v-for="loan in fakeLoans"
        :key="loan.id"
        class="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4"
      >
        <p class="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Loan ID</p>
        <p class="text-lg font-semibold text-white">{{ loan.id }}</p>

        <p class="mt-4 text-xs uppercase tracking-[0.3em] text-cyan-200/80">Title</p>
        <p class="text-base text-cyan-100">{{ loan.title }}</p>

        <p class="mt-4 text-xs uppercase tracking-[0.3em] text-cyan-200/80">Due Date</p>
        <p class="text-base text-amber-300">{{ loan.dueDate }}</p>
      </div>
    </div>
  </div>
</template>
