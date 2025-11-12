<template>
  <div class="rounded-3xl bg-slate-900/70 p-6 text-slate-100 shadow-lg">
    <h2 class="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-cyan-300/80">
      Please Log In To Continue
    </h2>

    <div v-if="user" class="space-y-4">
      <p class="text-sm text-cyan-100">
        Signed in as
        <span class="font-semibold text-white">{{ user.email }}</span>
      </p>

      <button
        class="inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        type="button"
        @click="handleSignOut"
      >
        Sign out
      </button>
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleSignIn">
      <div class="space-y-2">
        <label class="text-xs uppercase tracking-[0.3em] text-cyan-200/70" for="magic-email">
          Email
        </label>
        <input
          id="magic-email"
          v-model="email"
          type="email"
          required
          placeholder="you@example.com"
          class="w-full rounded-xl border border-cyan-500/40 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
        />
      </div>

      <button
        class="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/50 disabled:text-slate-400"
        type="submit"
        :disabled="loading"
      >
        <span v-if="!loading">Send magic link</span>
        <span v-else>Sending…</span>
      </button>

      <p v-if="feedback" class="text-sm text-cyan-200/80">
        {{ feedback }}
      </p>

      <p v-if="error" class="text-sm text-red-300">
        {{ error }}
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
const email = ref('')
const feedback = ref('')

const { user, loading, error, signInWithMagicLink, signOut } = useSupabaseAuth()

const handleSignIn = async () => {
  feedback.value = ''
  const success = await signInWithMagicLink(email.value.trim())
  if (success) {
    feedback.value = 'Check your inbox for the magic link to finish signing in.'
  }
}

const handleSignOut = async () => {
  feedback.value = ''
  await signOut()
}
</script>
