import type { AuthError, Session, SupabaseClient, User } from '@supabase/supabase-js'

const USER_STATE_KEY = 'supabase-auth-user'
const LOADING_STATE_KEY = 'supabase-auth-loading'
const ERROR_STATE_KEY = 'supabase-auth-error'

type SupabaseHashTokens = {
  accessToken: string
  refreshToken: string
}

function isAuthSessionMissingError(authError: AuthError | null) {
  if (!authError) {
    return false
  }

  const nameMatches = authError.name === 'AuthSessionMissingError'
  const messageMatches = authError.message?.toLowerCase().includes('auth session missing')
  return nameMatches || messageMatches
}

export function extractSupabaseHashTokens(): SupabaseHashTokens | null {
  if (!import.meta.client) {
    return null
  }

  const rawHash = window.location.hash ?? ''
  if (!rawHash || !rawHash.includes('access_token=')) {
    return null
  }

  const params = new URLSearchParams(rawHash.replace(/^#/, ''))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  const cleanUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState({}, document.title, cleanUrl)

  if (accessToken && refreshToken) {
    return {
      accessToken,
      refreshToken,
    }
  }

  return null
}

export async function absorbSupabaseAuthHash(client: SupabaseClient) {
  const tokens = extractSupabaseHashTokens()
  if (!tokens) {
    return
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    })

    if (sessionError) {
      console.error('Supabase auth setSession error', sessionError)
    } else {
      syncSupabaseAccessCookie(session)
    }
  } catch (hashError) {
    console.error('Supabase auth hash handling failed', hashError)
  }
}

export function useSupabaseAuth() {
  const user = useState<User | null>(USER_STATE_KEY, () => null)
  const loading = useState<boolean>(LOADING_STATE_KEY, () => false)
  const error = useState<string | null>(ERROR_STATE_KEY, () => null)

  onMounted(() => {
    void refreshSession()

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
    await absorbSupabaseAuthHash(client)
    const {
      data: sessionData,
      error: sessionError,
    } = await client.auth.getSession()

    if (!sessionError) {
      syncSupabaseAccessCookie(sessionData.session ?? null)
    }

    let data: { user: User | null } | undefined
    let authError: AuthError | null = null

    try {
      const response = await client.auth.getUser()
      data = response.data
      authError = response.error
    } catch (err) {
      console.error('Supabase auth getUser failed', err)
      authError = err as AuthError
      data = { user: null }
    }

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

  async function signInWithPassword(email: string, password: string) {
    error.value = null
    loading.value = true
    const client = useSupabaseBrowserClient()

    const {
      data,
      error: authError,
    } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (!authError && data?.user) {
      user.value = data.user
      syncSupabaseAccessCookie(data.session ?? null)
    }

    handleAuthResult(authError)
    loading.value = false

    return !authError
  }

  async function signUpWithPassword(email: string, password: string) {
    error.value = null
    loading.value = true
    const client = useSupabaseBrowserClient()

    const {
      data,
      error: authError,
    } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (!authError && data?.session) {
      user.value = data.user ?? null
      syncSupabaseAccessCookie(data.session)
    }

    handleAuthResult(authError)
    loading.value = false

    return {
      success: !authError,
      requiresEmailConfirmation: !authError && !data?.session,
    }
  }

  async function signOut() {
    const client = useSupabaseBrowserClient()
    const { error: authError } = await client.auth.signOut()
    handleAuthResult(authError)
    if (!authError) {
      user.value = null
      clearSupabaseAccessCookie()
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
    signInWithPassword,
    signUpWithPassword,
    signOut,
  }
}

function syncSupabaseAccessCookie(session: Session | null) {
  if (!import.meta.client) {
    return
  }

  if (!session?.access_token) {
    clearSupabaseAccessCookie()
    return
  }

  const maxAge = session.expires_at ? Math.max(session.expires_at - Math.floor(Date.now() / 1000), 0) : 60 * 60
  document.cookie = `sb-access-token=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
}

function clearSupabaseAccessCookie() {
  if (!import.meta.client) {
    return
  }

  document.cookie = 'sb-access-token=; Path=/; Max-Age=0; SameSite=Lax'
}
