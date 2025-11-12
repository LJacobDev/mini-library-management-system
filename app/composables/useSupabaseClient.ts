import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function useSupabaseBrowserClient() {
  const runtimeConfig = useRuntimeConfig()

  if (process.server) {
    throw new Error('useSupabaseBrowserClient must be called on the client')
  }

  const url = runtimeConfig.public.supabaseUrl
  const anonKey = runtimeConfig.public.supabaseAnonKey

  if (!url || !anonKey) {
    throw new Error('Supabase URL or anon key missing from runtime config')
  }

  if (!browserClient) {
    const resolvedUrl = url as string
    const resolvedAnonKey = anonKey as string

    browserClient = createClient(resolvedUrl, resolvedAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return browserClient
}
