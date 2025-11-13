# Fast Start Agent Context:  **LLM Agents**, read this section and compare it against our newer experiences, and made living edits to it so that it reflects the current state of the application so that we know what we have, and what we need to do

_Last updated: 2025-11-13_

## Current State Snapshot

- **Frontend shell**: Nuxt 4.2 + Tailwind CSS v4 + Nuxt UI. The public landing page (`pages/index.vue`) now pulls live catalog data via `useCatalogData`, features working search & media-type filters, and showcases branch info with Supabase-hosted imagery. Auth UX refresh is queued: guests keep the current header; authenticated users will gain a profile dropdown + sign-out actions, while staff additionally pick up a sidebar-driven dashboard.
- **Catalog experience**: `/api/catalog` serves Supabase-backed results with pagination, search, and validated media-type filters. Landing and dashboard catalog views now share the `CatalogGrid` component fed by `useCatalogData`, keep SSR and hydration in sync, reuse a shared `useDebouncedRef` composable for 300 ms search input debouncing, render via Tailwind responsive grids from the first paint, and elevate card clicks into the shared `MediaDetailModal` for richer item context with freshly added bibliographic metadata (ISBN, language, page counts, runtime).
- **AI integration**: `/api/check/openai` streams responses from OpenAI’s `gpt-4o-mini` using the official `openai` client and SSE bridge; `useAiStream` powers the real-time status card.
- **Supabase connectivity**: `/api/check/supabase` and the new catalog route call the live `mlms-demo` project through the cached service client. Schema/seed/RLS scripts are applied so media, loans, reservations, desk logs, and telemetry tables hold demo data behind RLS.
- **Developer tooling**: `/pages/debug/index.vue` (dev-only) aggregates health checks and catalog fetches for quick manual verification. `StatusCheckStream`/`StatusCheckString` components surface integration status in the dashboard shell. Reservation API work is scoped but paused after the working UI stub so we can prioritize staff tooling.
- **Docs & design notes**: Fast-start plan lives in `docs/dev/spec-fast-start*.md`; styling approach detailed in `docs/dev/tailwindcss-and-style-block-hybrid-approach.md` plus palette discussions in the style archive.

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

8. Ran repo-owned `schema.sql`, `seed.sql`, and `rls-policies.sql` against Supabase so the database now mirrors documentation and enforces locked-down role management policies.

## Upcoming Objectives

- **Auth-aware headers & routing**: Implement split guest/auth headers, profile dropdown with logout, and role-based redirects (members remain on `/`, staff head to the new `/dashboard`).
- **Dashboard experience**: Build the `/dashboard` layout with shared header + staff sidebar, default to catalog grid, and surface quick switches for check-out, check-in, and admin catalog management views.
- **Staff tooling UI**: Wire librarian check-out/check-in screens and admin catalog CRUD panels to the existing Supabase APIs with loading/error feedback so endpoints can be exercised end to end.
- **Member enhancements**: Add AI recommendation chat on the landing page for authenticated members and prep `/account/loans`/`/account/reservations` once reservation API resumes.
- **Reservation flow (paused)**: Resume real reservation endpoint + modal confirm dialog after dashboard tooling ships; keep plan documented for quick restart.
- **Documentation & testing**: Keep `spec-fast-start-*`, `agent-fast-start-context`, and `llm-training-cutoff-updates` in sync; add smoke tests when UI stabilizes.

### Prioritized next steps (short list)

1. Ship role-aware header/sidebar + routing so member/staff journeys diverge appropriately.
2. Stand up `/dashboard` with catalog, circulation, and admin views powered by existing APIs.
3. Add member AI chat pane on the landing page while preserving guest experience.
4. Once dashboard is live, resume reservation endpoint + account surfaces before moving to tests/palette refresh.

### Security considerations

- **Server-side session verification required**: Any Nuxt server route that mutates Supabase must verify the incoming Supabase session/JWT (using the publishable key or Admin API) before executing service-role operations. Client-side guards only hide UI—they do not protect the API. Without verification, malicious callers could hit the endpoint with no auth and still run service-role queries.
- Plan to add middleware/utilities (`requireUser` helper) that extracts the Supabase session from cookies/Authorization headers, validates it, checks role claims, then proceeds to the mutation logic.

## Notes for incoming agents

- The codebase uses `h3` server handlers (Nuxt server routes). Helpers live under `server/utils/` (`openaiClient.ts`, `supabaseServiceClient.ts`).
- Keep secrets server-only: use `runtimeConfig.server` or environment variables injected by Vercel. Do NOT expose secrets to `runtimeConfig.public`.
- If you need to iterate quickly on the AI streaming logic, use the `openaiClient` helper. It centralizes SDK usage and streaming logic.

_Append brief, dated notes here as you make changes so we keep a concise history for fast onboarding._

Keep using this file as the quick context hand-off for agents joining the fast-start track; append notable milestones or shifts as we progress.


# Log:  **LLM Agents**, do not delete any existing data in this section, but make regular additions to the bottom of this section with new notes about things done and decisions made, and a brief mention of what is intended to be done next 

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
- 2025-11-12 — Replaced enum `CREATE TYPE IF NOT EXISTS` with DO-block guards so Supabase reruns no longer error on type creation.
- 2025-11-12 — Executed `schema.sql`, `seed.sql`, and `rls-policies.sql` in Supabase; database now populated with demo data and RLS enforcing admin-only role changes end-to-end.
- 2025-11-12 — Introduced Nuxt UI dashboard shell: `app/app.vue` now wraps pages with `NuxtApp`/`NuxtLayout`, added `layouts/default.vue`, and scaffolded `layouts/dashboard.vue` with navbar, sidebar, and toolbar ready for the catalog view.
- 2025-11-12 — Added guarded `/pages/catalog.vue` targeting the dashboard layout with placeholder header/section until the mock media grid lands.
- 2025-11-12 — Added `useCatalogMock` composable with seeded demo titles and wired `/pages/catalog.vue` to render a Nuxt UI card grid.
- 2025-11-12 — Authored `docs/dev/spec/spec-fast-start-4.md` to pivot focus toward a public-first catalog experience, Supabase-backed data, and a debug control panel plan.
- 2025-11-12 — Noted in `docs/dev/spec/spec-fast-start-5.md` that we must archive the current dark palette and schedule a cheerful light-mode palette proposal; remember to spin up the design task soon.
- 2025-11-12 — Rebuilt `/pages/index.vue` into the public landing hero with Supabase-hosted imagery, welcome copy, and catalog preview cards hooked to `useCatalogMock` pending live data.
- 2025-11-12 — Refined landing welcome section with branch address, phone, and hours to match refreshed marketing copy.
- 2025-11-12 — Scaffolded `/pages/debug/index.vue` as a developer console with Nuxt UI cards hitting OpenAI/Supabase health checks and the catalog mock for rapid integration testing, now gated to dev-only builds.
- 2025-11-12 — Added Supabase-backed `/api/catalog` route with pagination, search, and media-type filters, returning normalized media summaries for the upcoming UI swap.
- 2025-11-12 — Clarified that `docs/dev/llm-training-cutoff-updates.md` is reserved for true post-cutoff ecosystem changes; kept catalog notes within this context log instead.
- 2025-11-12 — Added `AppHeader` to the default layout with brand link returning to `/` and login CTA routing to the guest flow.
- 2025-11-12 — Set /login to redirect to / when user is signed in, using server side checking so there is no flash of the unwanted screen before the redirect.
- 2025-11-12 — Vertically centered `/login` contents, added a guest-only middleware that issues a server-side redirect when Supabase cookies are present, and ensured client-side watchers replace history for signed-in users.
- 2025-11-12 — Updated the brand link behavior to smooth-scroll to the top of `/` when already on the landing page.
- 2025-11-12 — Normalized catalog media-type filters to Supabase enums (`book`, `video`, `audio`, `other`) and added backend guard so invalid filter values no longer break `/api/catalog`.
- 2025-11-12 — Added `/api/catalog` pagination metadata, extended `useCatalogData` with infinite scroll accumulation, and converted landing/dashboard catalog views to use intersection-observed load-more triggers with manual button fallback.
- 2025-11-12 — Introduced `useMediaDetail` composable to manage selected catalog items, modal open state, and future detail fetching hooks.
- 2025-11-12 — Debounced catalog search inputs (landing + dashboard views at 300 ms with watcher cleanup) to reduce redundant `/api/catalog` requests while typing.
- 2025-11-12 — Centered `/login` auth panel horizontally by constraining container width on larger screens.
- 2025-11-12 — Replaced custom `.catalog-grid` CSS with Tailwind utility classes so catalog tiles render multi-column immediately on load.
- 2025-11-12 — Guarded client-only search debounces and awaited `useCatalogData` to keep SSR/client catalog output aligned, clearing hydration mismatches.
- 2025-11-12 — Refactored `/pages/catalog.vue` to use the shared `CatalogGrid` with unified filters, summary badge header, and search reset, removing duplicated markup and restoring build health.
- 2025-11-13 — Extracted shared `useDebouncedRef` composable powering landing and dashboard catalog search inputs, removed redundant inline timeouts, and simplified dashboard filter controls.
- 2025-11-13 — Decided Media deletion via hard delete; add soft-delete column later if required.
- 2025-11-13 — Introduced `server/utils/supabaseApi.ts` consolidating role-aware session checks plus Supabase error helpers ahead of admin/loan route work.
- 2025-11-13 — Added `/api/admin/media` GET handler with admin-only Supabase query, pagination, search, and extended media fields.
- 2025-11-13 — Added `/api/admin/media` POST handler validating inputs and inserting new catalog rows into Supabase.
- 2025-11-13 — Added `/api/admin/media/:id` PATCH handler for partial updates with enum validation and normalization.
- 2025-11-13 — Added `/api/admin/media/:id` DELETE handler performing hard deletes per fast-start decision.
- 2025-11-13 — Extended `/pages/debug` console with admin media buttons (list/create/update/delete) using sample payload prompts.
- 2025-11-13 — Added `/api/loans` GET handler for librarian/admin filtered loan listings with pagination and status derivation.
- 2025-11-13 — Added `/api/loans` POST handler for librarian/admin checkouts with conflict guard and metadata capture.
- 2025-11-13 — Added `/api/loans/:id/return` POST handler for check-ins with loan event logging.
- 2025-11-13 — Added `/api/loans/:id/return` POST handler for check-ins with loan event logging.
- 2025-11-13 — Added `/api/loans/:id/renew` POST handler allowing staff or the borrowing member when no reservations block the item.
- 2025-11-13 — Wired catalog pages to the new `MediaDetailModal`; adjusted the modal component to follow Nuxt UI’s `v-model:open`/slot conventions so card clicks should surface the detail overlay for future enrichment.
- 2025-11-13 — Extended `/pages/debug` console with loan controls (list/checkout/return/renew) for rapid circulation testing.
- 2025-11-13 — Wired catalog pages to the new `MediaDetailModal`; adjusted the modal component to follow Nuxt UI’s `v-model:open`/slot conventions so card clicks should surface the detail overlay for future enrichment.
- 2025-11-13 — Filled in `MediaDetailModal` UI with cover art, summary, metadata, and availability sections that only render populated fields, ready for the upcoming Reserve action wiring.
- 2025-11-13 — Updated Supabase error normalization to translate common PostgREST auth and permission failures into correct 4xx status codes so unauthorized renew attempts no longer surface generic 500s.
- 2025-11-13 — Implemented `/api/ai/recommend` with Supabase-backed picks plus optional OpenAI summary, wired a matching debug console button, and fixed the button loading indicator to track by label.
- 2025-11-13 — Authored `docs/dev/improvements/media-embeddings.md` outlining the chat-vs-embedding recommendation paths and updated `/api/ai/recommend` to apply role-specific system prompts for member, librarian, and admin summaries.
- 2025-11-13 — Rebuilt `/api/ai/recommend` as a POST endpoint: prompt validation, keyword extraction (LLM + fallback), Supabase query, and role-aware summary response; updated debug console button and API notes accordingly.
- 2025-11-13 — Completed manual QA of the new `MediaDetailModal` on landing and dashboard catalog pages; verified auth-aware Reserve stub flow, success messaging reset, and slot-based action layout ahead of real API wiring.
- 2025-11-13 — Expanded `/api/catalog` select + mapper to include ISBN, language, page counts, and duration minutes so the detail modal renders richer metadata without extra fetches.
- 2025-11-13 — `/api/ai/recommend` now streams summaries via SSE, sending metadata before tokens so the upcoming chat UI can light up immediately while debug tooling stays compatible.
- 2025-11-13 — Scaffolded `AgentChatPanel` with Nuxt UI chat primitives and preview placeholders ahead of wiring to the streaming endpoint.
- 2025-11-13 — Hooked `AgentChatPanel` to `useAgentChat`, enabling real prompt submission, streaming status, and retry handling while keeping placeholder recommendations for empty states.
- 2025-11-13 — Enriched chat recommendation rail with skeleton loaders, empty-state guidance, and richer metadata badges ahead of page integration.
- 2025-11-13 — Mounted `AgentChatPanel` on the landing page for signed-in members and within the `/debug` console for rapid streaming verification.
- 2025-11-13 — Updated agent chat fetch + debug console to send event-stream headers/bodies so POST prompts stream correctly and bubble meaningful errors when auth or payload is missing.