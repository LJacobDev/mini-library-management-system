import { requireSupabaseSession } from '../../utils/requireSupabaseSession'

export default defineEventHandler(async (event) => {
  const { user, accessToken } = await requireSupabaseSession(event)

  return {
    authenticated: true,
    message: 'Supabase session verified.',
    user: {
      id: user.id,
      email: user.email,
      appMetadata: user.app_metadata,
      userMetadata: user.user_metadata,
    },
    accessTokenPreview: accessToken.slice(0, 8),
    checkedAt: new Date().toISOString(),
  }
})
