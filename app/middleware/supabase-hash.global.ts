import { defineNuxtRouteMiddleware } from 'nuxt/app'
import { absorbSupabaseAuthHash, useSupabaseBrowserClient } from '#imports'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return
  }

  if (!window.location.hash.includes('access_token=')) {
    return
  }

  const supabase = useSupabaseBrowserClient()
  await absorbSupabaseAuthHash(supabase)
})
