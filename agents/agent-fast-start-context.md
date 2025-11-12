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
