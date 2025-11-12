import { defineNuxtPlugin } from 'nuxt/app'
import {
  absorbSupabaseAuthHash,
  extractSupabaseHashTokens,
  useSupabaseBrowserClient,
} from '#imports'

let pendingSessionTokens: { access_token: string; refresh_token: string } | null = null

if (import.meta.client) {
  const tokens = extractSupabaseHashTokens()
  if (tokens) {
    pendingSessionTokens = {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    }
  }
}

export default defineNuxtPlugin(async () => {
  if (!import.meta.client) {
    return
  }

  const supabase = useSupabaseBrowserClient()

  if (pendingSessionTokens) {
    const { error } = await supabase.auth.setSession(pendingSessionTokens)
    if (error) {
      console.error('Supabase auth setSession error', error)
    }
    pendingSessionTokens = null
    return
  }

  await absorbSupabaseAuthHash(supabase)
})
