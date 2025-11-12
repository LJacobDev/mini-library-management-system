import type { AuthError, User } from '@supabase/supabase-js'

const USER_STATE_KEY = 'supabase-auth-user'
const LOADING_STATE_KEY = 'supabase-auth-loading'
const ERROR_STATE_KEY = 'supabase-auth-error'

function isAuthSessionMissingError(authError: AuthError | null) {
  if (!authError) {
    return false
  }

  const nameMatches = authError.name === 'AuthSessionMissingError'
  const messageMatches = authError.message?.toLowerCase().includes('auth session missing')
  return nameMatches || messageMatches
}

export function useSupabaseAuth() {
  const user = useState<User | null>(USER_STATE_KEY, () => null)
  const loading = useState<boolean>(LOADING_STATE_KEY, () => false)
  const error = useState<string | null>(ERROR_STATE_KEY, () => null)

  onMounted(async () => {
    await refreshSession()

    const client = useSupabaseBrowserClient()
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })

    onBeforeUnmount(() => {
      subscription.unsubscribe()
    })
  })

  async function refreshSession() {
    const client = useSupabaseBrowserClient()
    const { data, error: authError } = await client.auth.getUser()

    if (isAuthSessionMissingError(authError)) {
      user.value = null
      error.value = null
      return
    }

    handleAuthResult(authError)
    user.value = data?.user ?? null
  }

  async function signInWithMagicLink(email: string) {
    error.value = null
    loading.value = true
    const client = useSupabaseBrowserClient()

    const { error: authError } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    handleAuthResult(authError)
    loading.value = false

    return !authError
  }

  async function signOut() {
    const client = useSupabaseBrowserClient()
    const { error: authError } = await client.auth.signOut()
    handleAuthResult(authError)
    if (!authError) {
      user.value = null
    }
  }

  function handleAuthResult(authError: AuthError | null) {
    if (isAuthSessionMissingError(authError)) {
      error.value = null
      return
    }

    if (authError) {
      console.error('Supabase auth error', authError)
      error.value = authError.message
    } else {
      error.value = null
    }
  }

  return {
    user,
    loading,
    error,
    refreshSession,
    signInWithMagicLink,
    signOut,
  }
}
