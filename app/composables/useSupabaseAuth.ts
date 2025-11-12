import type { AuthError, User } from '@supabase/supabase-js'

const USER_STATE_KEY = 'supabase-auth-user'
const LOADING_STATE_KEY = 'supabase-auth-loading'
const ERROR_STATE_KEY = 'supabase-auth-error'

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
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await client.auth.getUser()

    handleAuthResult(authError)
    user.value = supabaseUser ?? null
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
