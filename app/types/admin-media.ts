export type AdminMediaFormMode = 'create' | 'edit'

export interface AdminMediaFormPayload {
  title: string
  creator: string
  mediaType: string
  mediaFormat: string
  isbn: string | null
  genre: string | null
  subject: string | null
  description: string | null
  coverUrl: string | null
  language: string | null
  pages: number | null
  durationSeconds: number | null
  publishedAt: string | null
}
