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

## Circulation Actions

Auth guard lives on `/api/loans/*` handlers; middleware enforces librarian/admin roles for mutating requests.

| Route | Method | Purpose | Auth | Payload | Notes |
| --- | --- | --- | --- | --- | --- |
| `/api/loans` | GET | View open loans + filters | `librarian+` | query: `memberId?`, `status?` | join `profiles` for member names |
| `/api/loans` | POST | Checkout item to member | `librarian+` | body: `{ memberId, copyId, dueAt? }` | conditional update: `UPDATE media_copies SET status='checked_out' WHERE id=:copyId AND status='available' RETURNING` |
| `/api/loans/:loanId/return` | POST | Check-in item | `librarian+` | body: `{ condition?, notes? }` | complete loan, mark copy available |
| `/api/loans/:loanId/renew` | POST | Extend due date | `librarian+` | body: `{ dueAt }` | ensure copy still checked out |

Minimum viable implementation:
1. Enforce status transitions (no double checkout, etc.).
2. Wrap Supabase updates in transaction-like sequence (await sequential calls).
3. Respond with updated loan record.

## AI Recommendations (First-pass)

| Route | Method | Purpose | Auth | Payload | Notes |
| --- | --- | --- | --- | --- | --- |
| `/api/ai/recommend` | POST | LLM keyword extraction + Supabase search + LLM summary | `member` or higher | body: `{ prompt, filters? }` | Performs two OpenAI calls (keywords → summary); returns `{ items, keywords, summary }` |

Minimum viable implementation:
1. Validate member session (`member`+), sanitize prompt (trim, length cap, profanity guard TBD).
2. Call OpenAI (or swappable provider) to extract 3-6 keywords; fall back to local reducer if parsing fails.
3. Query Supabase `media` with those keywords and optional filters; cap results for the downstream LLM.
4. Call OpenAI again to craft a role-aware summary tailored to the user (`member`, `librarian`, `admin`).
5. Return items, keyword diagnostics, and summary text to the front end (no SSE yet).

## Debug Console Hooks

- Extend `app/pages/debug/index.vue` with panels for each route. Each panel should:
  - Show minimal form inputs mirroring the payloads above (e.g., memberId, copyId, media fields).
  - Trigger `await $fetch()` calls pointing at the new API endpoints.
  - Render raw JSON responses and status codes for quick validation.
- Provide canned payload buttons ("Checkout sample copy", "Mock recommendations") that hydrate the form values to speed manual tests.
- Surface Supabase session status in the console header so role constraints are obvious during testing.

## Next Steps Checklist

- [x] Implement handlers under `server/api/admin/media/*.ts`, `server/api/librarian/loans/*.ts`, `/server/api/ai/recommend.get.ts`.
- [ ] Add shared helper for Supabase error normalization.
- [ ] Extend responses to align with eventual OpenAPI spec.
- [ ] Build the `/debug` console panels + canned payload buttons described above.

## Open Questions

- Should admin DELETE also remove related `media_copies`, or flag them archived separately?
- Do we need optimistic concurrency (updated_at checks) before going live?
- How will we seed AI recommendation prompts (genres vs. embeddings)?
