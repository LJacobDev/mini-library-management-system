<template>
  <div class="rounded-3xl bg-slate-900/70 p-6 text-slate-100 shadow-lg">
    <h2 class="mb-4 text-center text-xl font-semibold uppercase tracking-[0.4em] text-cyan-300/80">
      {{ isAuthenticated ? 'Welcome!' : isSignUp ? 'Create Account' : 'Login' }}
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

    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <p class="text-sm text-center text-cyan-100">
        <span v-if="isSignUp">Create your account with an email and password, or request a magic link. After signing up, watch your inbox for the confirmation link to activate your account.</span>
        <span v-else>Sign in with your password or request a magic link to your inbox.</span>
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

      <div v-if="isSignUp" class="space-y-2">
        <label class="text-xs uppercase tracking-[0.3em] text-cyan-200/70" for="auth-password-confirm">
          Confirm Password
        </label>
        <input
          id="auth-password-confirm"
          v-model="confirmPassword"
          type="password"
          minlength="6"
          placeholder="repeat password"
          class="w-full rounded-xl border border-cyan-500/40 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
        >
      </div>

      <div class="space-y-2">
        <button
          class="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/50 disabled:text-slate-400"
          type="submit"
          :disabled="loading"
        >
          <span v-if="!loading">{{ isSignUp ? 'Create account' : 'Sign in with password' }}</span>
          <span v-else>{{ isSignUp ? 'Creating…' : 'Signing in…' }}</span>
        </button>
        <button
          class="inline-flex w-full items-center justify-center rounded-full border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:border-cyan-500/20 disabled:text-slate-500"
          type="button"
          :disabled="loading"
          @click="handleMagicLink"
        >
          Send a magic link instead
        </button>
        <button
          class="inline-flex w-full items-center justify-center rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-cyan-300 underline-offset-2 transition hover:text-cyan-200 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="loading"
          @click="toggleAuthMode"
        >
          {{ isSignUp ? 'Have an account? Sign in' : 'Need an account? Create one' }}
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
type AuthMode = 'sign-in' | 'sign-up'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const feedback = ref('')
const authMode = ref<AuthMode>('sign-in')

const {
  user,
  loading,
  error,
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
  signOut,
} = useSupabaseAuth()

const isAuthenticated = computed(() => Boolean(user.value))
const userEmail = computed(() => user.value?.email ?? '')
const errorMessage = computed(() => error.value)
const isSignUp = computed(() => authMode.value === 'sign-up')

watch(authMode, () => {
  feedback.value = ''
  password.value = ''
  confirmPassword.value = ''
  error.value = null
})

const toggleAuthMode = () => {
  authMode.value = isSignUp.value ? 'sign-in' : 'sign-up'
}

const handleSubmit = async () => {
  feedback.value = ''
  error.value = null
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

  if (isSignUp.value) {
    if (trimmedPassword !== confirmPassword.value) {
      feedback.value = 'Passwords do not match.'
      return
    }

    const result = await signUpWithPassword(trimmedEmail, trimmedPassword)
    if (result.success) {
      if (result.requiresEmailConfirmation) {
        feedback.value = 'Check your email to confirm your account, then sign in.'
        authMode.value = 'sign-in'
      } else {
        feedback.value = 'Account created! Check your inbox for the confirmation link to finish setting things up.'
        email.value = ''
      }
      password.value = ''
      confirmPassword.value = ''
    }
    return
  }

  const success = await signInWithPassword(trimmedEmail, trimmedPassword)
  if (success) {
    feedback.value = 'Signed in successfully.'
    password.value = ''
    confirmPassword.value = ''
  }
}

const handleSignOut = async () => {
  feedback.value = ''
  await signOut()
  if (!errorMessage.value) {
    feedback.value = 'Signed out successfully.'
  }
  password.value = ''
  confirmPassword.value = ''
  authMode.value = 'sign-in'
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
    confirmPassword.value = ''
  }
}
</script>
