# Fast Start API Notes

> Lightweight sketch of the first backend endpoints. Meant to unblock rapid implementation and evolve alongside the code.

## Shared Assumptions

- **Client**: Nuxt 4 server routes under `server/api`. Each handler uses `defineEventHandler`.
- **Auth**: Call `requireSupabaseSession(event, { roles: [...] })` before any mutating work or AI access.
- **DB client**: `supabaseServiceClient()` for service-role actions; `createSupabaseClient(event)` for session-scoped reads when possible.
- **Tables** (from `docs/dev/data/schema.sql`):
  - `media_items` (catalog records)
  - `media_copies` (physical/ digital instances)
  - `loans` (circulation state)
  - `profiles` (role lookup)
- **Response shape**: `{ data, error? }` for now. We can swap to typed responses later.
- **Error handling**: return early with `createError({ statusCode, statusMessage })`.

## Admin — Media Catalog CRUD

| Route | Method | Purpose | Auth | Payload (req) | Notes |
| --- | --- | --- | --- | --- | --- |
| `/api/admin/media` | GET | Paginate catalog for admin panels | `admin` | query: `page`, `limit`, `q?` | use Supabase `range` + `ilike` for search |
| `/api/admin/media` | POST | Create new media item + optional copies | `admin` | body: `{ title, author, format, tags?, description?, copies? }` | insert item, optional `copies` array to seed `media_copies` |
| `/api/admin/media/:id` | PATCH | Update core fields | `admin` | body: partial media fields | support partial updates |
| `/api/admin/media/:id` | DELETE | Soft delete (set `archived_at`) | `admin` | none | implement as update to avoid hard delete |

Minimum viable implementation:
1. Validate body with simple guards (presence, types).
2. Use Supabase `from('media_items')` CRUD calls.
3. Return full updated row to caller.

## Librarian — Circulation Actions

| Route | Method | Purpose | Auth | Payload | Notes |
| --- | --- | --- | --- | --- | --- |
| `/api/librarian/loans` | GET | View open loans + filters | `librarian` | query: `memberId?`, `status?` | join `profiles` for member names |
| `/api/librarian/loans` | POST | Checkout item to member | `librarian` | body: `{ memberId, copyId, dueAt? }` | create loan, mark copy `status='checked_out'` |
| `/api/librarian/loans/:loanId/return` | POST | Check-in item | `librarian` | body: `{ condition?, notes? }` | complete loan, mark copy available |
| `/api/librarian/loans/:loanId/renew` | POST | Extend due date | `librarian` | body: `{ dueAt }` | ensure copy still checked out |

Minimum viable implementation:
1. Enforce status transitions (no double checkout, etc.).
2. Wrap Supabase updates in transaction-like sequence (await sequential calls).
3. Respond with updated loan record.

## AI Recommendations (Placeholder)

| Route | Method | Purpose | Auth | Payload | Notes |
| --- | --- | --- | --- | --- | --- |
| `/api/recommendations/suggest` | POST | Provide mock recommendations | `member` or higher | body: `{ memberId, seedMediaIds? }` | call internal helper for now |

Minimum viable implementation:
1. Validate member session (`member`+).
2. Return canned list: `[{ mediaId, title, reason }]`.
3. Later swap helper to call OpenAI + Supabase embeddings.

## Next Steps Checklist

- [ ] Implement handlers under `server/api/admin/media/*.ts`, `server/api/librarian/loans/*.ts`, `server/api/recommendations/suggest.post.ts`.
- [ ] Add shared helper for Supabase error normalization.
- [ ] Extend responses to align with eventual OpenAPI spec.
- [ ] Write debug playground hooks (e.g., `app/pages/debug/index.vue`) to exercise each endpoint.

## Open Questions

- Should admin DELETE also remove related `media_copies`, or flag them archived separately?
- Do we need optimistic concurrency (updated_at checks) before going live?
- How will we seed AI recommendation prompts (genres vs. embeddings)?
