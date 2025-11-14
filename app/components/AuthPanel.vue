<template>
  <div class="rounded-3xl bg-slate-900/70 p-6 text-slate-100 shadow-lg">
    <h2 class="mb-4 text-center text-xl font-semibold uppercase tracking-[0.4em] text-cyan-300/80">
      {{ isAuthenticated ? 'Welcome!' : 'Login - Signup' }}
    </h2>

    <div v-if="isAuthenticated" class="space-y-4">
      <p class="text-sm text-cyan-100">
        Signed in as
        <span class="font-semibold text-white">{{ userEmail }}</span>
      </p>

      <button
        class="inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        type="button"
        @click="handleSignOut"
      >
        Sign out
      </button>
    </div>

    <form v-else class="space-y-4" @submit.prevent="handlePasswordSignIn">
      <p class="text-sm text-center text-cyan-100">
        Enter your email, then click for a link to be sent, or write in your password.
      </p>

      <div class="space-y-2">
        <label class="text-xs uppercase tracking-[0.3em] text-cyan-200/70" for="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          v-model="email"
          type="email"
          required
          placeholder="you@example.com"
          class="w-full rounded-xl border border-cyan-500/40 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
        >
      </div>

      <div class="space-y-2">
        <label class="text-xs uppercase tracking-[0.3em] text-cyan-200/70" for="auth-password">
          Password
        </label>
        <input
          id="auth-password"
          v-model="password"
          type="password"
          minlength="6"
          placeholder="minimum 6 characters"
          class="w-full rounded-xl border border-cyan-500/40 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
        >
      </div>

      <div class="space-y-2">
        <button
          class="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/50 disabled:text-slate-400"
          type="submit"
          :disabled="loading"
        >
          <span v-if="!loading">Sign in with password</span>
          <span v-else>Signing in…</span>
        </button>
        <button
          class="inline-flex w-full items-center justify-center rounded-full border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:border-cyan-500/20 disabled:text-slate-500"
          type="button"
          :disabled="loading"
          @click="handleMagicLink"
        >
          Send a magic link instead
        </button>
      </div>

      <p v-if="feedback" class="text-sm text-cyan-200/80">
        {{ feedback }}
      </p>

      <p v-if="errorMessage" class="text-sm text-red-300">
        {{ errorMessage }}
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
const email = ref('')
const password = ref('')
const feedback = ref('')

const {
  user,
  loading,
  error,
  signInWithMagicLink,
  signInWithPassword,
  signOut,
} = useSupabaseAuth()

const isAuthenticated = computed(() => Boolean(user.value))
const userEmail = computed(() => user.value?.email ?? '')
const errorMessage = computed(() => error.value)

const handlePasswordSignIn = async () => {
  feedback.value = ''
  const trimmedEmail = email.value.trim()
  const trimmedPassword = password.value
  if (!trimmedEmail) {
    feedback.value = 'Please enter your email address.'
    return
  }

  if (trimmedPassword.length < 6) {
    feedback.value = 'Please enter your password (at least 6 characters).'
    return
  }

  const success = await signInWithPassword(trimmedEmail, trimmedPassword)
  if (success) {
    feedback.value = 'Signed in successfully.'
    password.value = ''
  }
}

const handleSignOut = async () => {
  feedback.value = ''
  await signOut()
  if (!errorMessage.value) {
    feedback.value = 'Signed out successfully.'
  }
  password.value = ''
}

const handleMagicLink = async () => {
  feedback.value = ''
  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    feedback.value = 'Please enter your email address.'
    return
  }

  const success = await signInWithMagicLink(trimmedEmail)
  if (success) {
    feedback.value = 'Check your inbox for the link to finish signing in.'
    email.value = ''
    password.value = ''
  }
}
</script>
