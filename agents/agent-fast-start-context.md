# Fast Start Agent Context

_Last updated: 2025-11-12_

## Current State Snapshot

- **Framework & styling**: Nuxt 4.2 app with Tailwind CSS v4 and Nuxt UI components; base shell (`app.vue`) renders the mini LMS hero plus backend health cards.
- **AI integration**: `/api/check/openai` streams responses from OpenAI’s `gpt-4o-mini` using the official `openai` npm client and an SSE bridge. Front end consumes the stream via `useAiStream` and the `StatusCheckStream` component.
- **Database integration**: `/api/check/supabase` connects to the live `mlms-demo` Supabase project, querying table `test-check` (row `id = 1`) with a cached server-side client (`supabaseServiceClient`).
- **Docs & plans**: `docs/dev/spec-fast-start.md`, `spec-fast-start-2.md`, and `spec-fast-start-3.md` contain the fast-track roadmap; Section 10/11 outline the execution plan and Nuxt UI overlays.

### Live deployment

- The app is deployed to Vercel and confirmed working in production.
- Vercel project has server-only environment variables configured (OpenAI key, Supabase URL & secret) so server routes run in prod using real services.

## Work Completed So Far (Timeline)

1. Captured fast-start strategy docs (`spec-fast-start.md`, updates through `spec-fast-start-3.md`).
2. Wired initial backend round-trip: `app.vue` fetching `/api/ai/recommend` mock message.
3. Implemented OpenAI SSE path:
   - Added runtime OpenAI helper (`openaiClient.ts`).
   - Built `/api/check/openai` streaming endpoint.
   - Created `useAiStream` composable + updated `StatusCheckStream` to stream tokens.
4. Brought Supabase online:
   - Added `supabaseServiceClient.ts` (cached service client).
   - Updated `/api/check/supabase` to fetch live `test-check` data.
5. Ensured `LoadingMessage` uses slots and other UI tweaks per quick-turn requests.

6. Deployed to Vercel and validated production:
   - `/api/check/openai` streams successfully in prod.
   - `/api/check/supabase` returns live data from `mlms-demo`.

7. Removed SQLite fallback from active plan — Supabase is the canonical data source now.

## Upcoming Objectives

- **Catalog endpoint**: Build `/api/catalog` backed by Supabase (or mock fallback) and surface results in a simple UI grid (`StatusCheckStream` currently targets health checks only).
- **Supabase auth prototype**: Introduce Supabase client-side auth flow so the demo can gate access (per fast-start checklist).
- **Dashboard routes**: Scaffold `/catalog`, `/account/loans`, `/desk/checkout`, `/admin/media` using Nuxt UI primitives and data composables.
- **Debug screen polish**: Add `/debug/data` page buttons for OpenAI/Supabase pings and the forthcoming SQLite check.
- **Docs update cadence**: Continue appending to `spec-fast-start-3.md` and log Nuxt/Tailwind/Supabase deltas in `docs/dev/llm-training-cutoff-updates.md`.

### Prioritized next steps (short list)

1. Wire Supabase client-side auth (publishable key in runtime/public, server-side secret remains protected). This lets us demo protected flows and user-specific data.
2. Implement `/api/catalog` backed by Supabase and show a minimal catalog page so stakeholders can browse live rows.
3. Add basic error UI and retry/backoff behavior for OpenAI SSE and Supabase queries to reduce flakiness during demos.
4. Add a small CI smoke test that hits `/api/check/openai` and `/api/check/supabase` after deploy to verify integrations.

### Security considerations

- **Server-side session verification required**: Any Nuxt server route that mutates Supabase must verify the incoming Supabase session/JWT (using the publishable key or Admin API) before executing service-role operations. Client-side guards only hide UI—they do not protect the API. Without verification, malicious callers could hit the endpoint with no auth and still run service-role queries.
- Plan to add middleware/utilities (`requireUser` helper) that extracts the Supabase session from cookies/Authorization headers, validates it, checks role claims, then proceeds to the mutation logic.

## Notes for incoming agents

- The codebase uses `h3` server handlers (Nuxt server routes). Helpers live under `server/utils/` (`openaiClient.ts`, `supabaseServiceClient.ts`).
- Keep secrets server-only: use `runtimeConfig.server` or environment variables injected by Vercel. Do NOT expose secrets to `runtimeConfig.public`.
- If you need to iterate quickly on the AI streaming logic, use the `openaiClient` helper. It centralizes SDK usage and streaming logic.

_Append brief, dated notes here as you make changes so we keep a concise history for fast onboarding._

Keep using this file as the quick context hand-off for agents joining the fast-start track; append notable milestones or shifts as we progress.

### Log

- 2025-11-12 — `AuthPanel` now binds to the reactive Supabase auth state so logging out updates the UI and surfaces success/error feedback inline.
- 2025-11-12 — `useSupabaseAuth` now ignores Supabase `AuthSessionMissingError` so signed-out refreshes stay clean without logging false auth errors.
- 2025-11-12 — Added `auth.global` middleware plus `/login` and `/account/loans` pages; routes tagged with `requiresAuth` now redirect unauthenticated users to the login flow with redirect preservation.
- 2025-11-12 — `useSupabaseAuth` now absorbs Supabase magic-link hashes (`#access_token=...`) by calling `setSession` with the tokens, removing the hash and keeping the router quiet.
- 2025-11-12 — Refined Supabase auth bootstrap: `supabase-auth` client plugin now strips hashes during module evaluation (route middleware removed as redundant) so magic-link redirects load cleanly.
- 2025-11-12 — Adjusted `useSupabaseAuth` lifecycle hooks to register `onBeforeUnmount` without awaiting inside `onMounted`, eliminating Vue’s "no active component" warning.
- 2025-11-12 — Added `server/utils/requireSupabaseSession.ts` to centralize server-side Supabase session validation (HTTP 401 when tokens missing/invalid).
- 2025-11-12 — Added `/api/debug/auth-check` to exercise `requireSupabaseSession` manually (401 when signed out, JSON user payload when signed in).
- 2025-11-12 — Synced Supabase access tokens into a client cookie so server APIs can validate sessions via `requireSupabaseSession` without custom headers.
- 2025-11-12 — `/api/account/loans` now requires `requireSupabaseSession`, returning placeholder loan data only for authenticated users.
- 2025-11-12 — Reminder: any new mutating server route must import `requireSupabaseSession` before touching Supabase (see `spec-fast-start-3.md`).
- 2025-11-12 — Added `docs/data/seed.sql` seeding roles, 40 media items (10 per type), and sample loans using Supabase storage cover URLs.
- 2025-11-12 — Drafted `docs/data/rls-policies.sql` with `current_user_role()` helper and scoped member vs staff policies (select policies to authenticated role, writes limited to librarian/admin).
- 2025-11-12 — Tightened RLS per spec: catalog read now open to guests; `users` table inserts/updates/deletes restricted to admins; future tables (media_holds, desk_transactions, etc.) must carry the same guest-read/member-self/admin-write pattern.
- 2025-11-12 — Expanded schema/seed docs with `profiles`, `media_reservations`, `loan_events`, `desk_transactions`, and `client_logs` tables plus matching sample data so we can wire future features without pausing for migrations.
- 2025-11-12 — Settled seeding plan: run `schema.sql` then forthcoming `seed.sql` with profiles/media/loans seeded against Supabase; fallback cover URLs will point at our own storage bucket.
- 2025-11-12 — Storage plan: create public Supabase bucket `covers/` (folders per media type) and upload CC0 images for default/fallback covers before finalizing seeds.
- 2025-11-12 — Observed browser tab briefly showing `#access_token=...` after magic-link; It has been fixed in nuxt.config.ts head settings
- 2025-11-12 — Hardened role management: moved `current_user_role()` into `schema.sql`, added guard triggers so only admins (or service role) can modify `users`/`profiles` roles, and cleaned `schema.sql` sample data in favor of `seed.sql`.
- 2025-11-12 — `schema.sql` now uses `CREATE TABLE IF NOT EXISTS` across catalog tables; `rls-policies.sql` tightened so non-admin updates must preserve their role assignments.
