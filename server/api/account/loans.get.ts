import { requireSupabaseSession } from '../../utils/requireSupabaseSession'

export default defineEventHandler(async (event) => {
  const { user } = await requireSupabaseSession(event)

  return {
    userId: user.id,
    loans: [
      {
        id: 'demo-loan-01',
        title: 'Sample Book Placeholder',
        dueDate: '2025-12-01',
        status: 'active',
      },
    ],
  }
})
