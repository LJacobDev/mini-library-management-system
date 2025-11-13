import { createError, getRouterParam } from 'h3'
import { getSupabaseContext, normalizeSupabaseError } from '../../../utils/supabaseApi'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing media ID.',
    })
  }

  const { supabase } = await getSupabaseContext(event, { roles: ['admin'] })

  const { error } = await supabase.from('media').delete().eq('id', id)

  if (error) {
    throw normalizeSupabaseError(error, 'Unable to delete media item.')
  }

  return {
    success: true,
    id,
  }
})
