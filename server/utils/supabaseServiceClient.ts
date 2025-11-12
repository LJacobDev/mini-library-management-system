import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError } from 'h3'

let cachedClient: SupabaseClient | null = null

export function getSupabaseServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !secretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase credentials are not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.',
    })
  }

  if (!cachedClient) {
    cachedClient = createClient(url, secretKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  return cachedClient
}
