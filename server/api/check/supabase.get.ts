import { getSupabaseServiceClient } from '../../utils/supabaseServiceClient'

export default defineEventHandler(async () => {
  const supabase = getSupabaseServiceClient()

  const { data, error } = await supabase
    .from('test-check')
    .select('content')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('Supabase health check failed', error)
    return {
      success: false,
      message: 'Failed to query Supabase.',
    }
  }

  return {
    success: true,
    message: data?.content ?? 'Supabase responded but no content found.',
  }
})
