# Fast Start Plan — Public-First Consolidated Edition

_Last updated: 2025-11-16_

This successor merges the structure of `spec-fast-start-3.md` with the public-first refresh from `spec-fast-start-4.md`. It keeps the speed-focused philosophy while re-sequencing work so the public catalog shines first, Supabase data replaces mocks early, and librarian tooling resumes once visitors see a production-ready face.

## 1. Guiding Constraints

- **Delight unauthenticated visitors**: `/` becomes the primary showcase with a hero, search/filter controls, infinite scroll, and media detail modals. No sidebar when signed out.
- **Serve live data quickly**: Catalog views hydrate from Supabase via Nuxt server routes as soon as the landing UI stands up. Mocks stay only for contingency tests.
- **Protect sensitive services**: AI recommendations and any mutating operations require Supabase auth (`requireSupabaseSession`) before touching service-role clients.
- **Keep manual testing fast**: Ship a debug console/button panel to trigger CRUD/check-in/out endpoints with canned payloads before richer UI wiring.
- **Maintain the broader roadmap**: Member dashboards, librarian CRUD, desk flows, CI/docs work continue after the public push.
- **Nuxt/Tailwind discipline**: Nuxt 4 SSR for public catalog, CSR for dashboards; Tailwind v4 as default styling tool with Nuxt UI components when they accelerate layout.
- **Documentation hygiene**: Log Nuxt/Tailwind/Supabase/OpenAI deltas in `docs/dev/llm-training-cutoff-updates.md` and append milestones to `agents/agent-fast-start-context.md`.
- **Visual accessibility**: Maintain both light and dark themes, validating color contrast during each milestone. Archive the current black+green palette (`docs/dev/style-archive.md`) and plan a library-appropriate palette overhaul soon. _Status_: the Nuxt shell now forcibly sets `data-theme="dark"` + `color-scheme: dark` so every viewer sees the vetted dark palette until the warmer light theme ships.

## 2. Fast-Track Checklist (execute in order)

0. **Toolchain & initial integrations** (complete)
   - [x] `npm install` / `npm run dev` baseline check.
   - [x] `/api/ai/recommend` mocked JSON rendered in `app.vue`.
   - [x] `/api/check/openai.get.ts` streaming bridge + `StatusCheckStream` SSE wiring.
   - [x] `/api/check/supabase.get.ts` hitting `mlms-demo` (schema/seed/RLS applied).
   - [x] Supabase auth bootstrap (`useSupabaseAuth`, middleware) and `requireSupabaseSession` enforcement.
   - [x] Status view moved to `/status`; root page freed for catalog work.

1. **Landing hero & navigation revamp** (Phase A.1)
   - [x] Redesign `/` with hero (“Welcome to Great City Community Library”), imagery, CTA, and top navigation (login/register, theme toggle, optional quick links).
   - [x] Remove sidebar for guests; rely on a clean top navbar.

2. **Supabase catalog pipeline** (Phase A.2)
   - [x] Implement `server/api/catalog/index.get.ts` (pagination, search, filters, availability joins) and optional `catalog/[id].get.ts` for modal data.
   - [x] Build `useCatalogData` composable wrapping `$fetch` with SSR-friendly pagination/infinite scroll helpers.
   - [x] Swap `useCatalogMock` usages for live Supabase data on landing and catalog pages; keep mock helper for tests/storybook.

3. **Infinite scroll, search, and filter UX** (Phase A.3)
   - [x] Wire IntersectionObserver-based infinite scroll (10–20 items per page) with query param forwarding.
   - [x] Add search bar and filter chips tied to Supabase `ilike`/`eq` filters.

4. **Media detail modal & auth-aware actions** (Phase A.4)
   - [x] Open `UDialog`/`USlideover` on card click showing metadata, availability, related reservations/loans summary.
   - [x] Guests see disabled `Reserve` prompting the auth modal; authenticated members see active `Reserve`/`Borrow` buttons (stub responses for now).

5. **Palette refresh & light-mode QA** (Phase A.5)
   - [ ] Shift Nuxt UI/Tailwind tokens toward a warmer civic palette for light mode while preserving dark mode.
   - [ ] Add light/dark toggle surface and document contrast checks; log findings in `llm-training-cutoff-updates.md`.
   - _Note_: Current state forces the dark palette globally via `app/app.vue` head attrs + base CSS tokens to keep prod screenshots consistent until the light palette is finalized.

6. **Debug controls & health checks** (Phase A.6 → Phase B entry point)
   - [x] Create `/debug` console with buttons exercising catalog CRUD, circulation, and AI endpoints using canned payloads; show structured responses.
   - [ ] Rework `/debug` console to have more intuitive and easy to use debugging controls and outputs
   - [ ] Ensure actions behave both authenticated (200) and unauthenticated (401) for quick verification.

7. **Core circulation & admin endpoints** (Phase B)
   - [ ] Add `server/api/media` CRUD routes guarded by `requireSupabaseSession` + role checks.
   - [ ] Implement `/api/desk/checkout.post.ts`, `/api/desk/checkin.post.ts`, and supporting Supabase mutations (`media_loans`, `media_reservations`, logging tables).
   - [x] Reintroduce dashboard layout for signed-in users with quick links to loans, reservations, admin catalog.

8. **Interactive librarian/member surfaces** (Phase B continuation)
   - [ ] Update `/account/loans` to pull Supabase-backed member data with optimistic renewals.
   - [x] Scaffold `/dashboard/desk` and `/dashboard/admin` forms using Nuxt UI tables/forms tied to the new endpoints.

9. **Deferred enhancements** (Phase C)
   - [ ] Make use of /public for hero image and fallback cover art images or else investigate other ways to make hero image paint faster
   - [ ] Implement the reservations functionality and member's ability to renew current loan online if no reservation is pending on it
   - [ ] Polish AI assistant UI, add rate limiting as needed.  
   - [ ] AI chat fix the chat streamed message stopping mid delivery.
   - [ ] AI chat enable markdown rendering, and persisten chat context that allows followup questions.
   - [ ] AI chat investigate using embeddings to make only one openai api call per catalog based request.
   - [ ] Wire CI smoke tests against `/api/check/*`, `/api/catalog`.
   - [x] Capture screenshots/video walkthrough.
   - [ ] Accessibility sweep, and documentation sync (`spec-final`, `plans-ci-cd-*`).

## 3. Minimum Feature Surface (with Nuxt UI assists)

### 3.1 Public Catalog & Landing (SSR, Phase A)

- **Routes**: `/` (hero + catalog), `/catalog`, `/catalog/[id]`.
- **Data**: Supabase tables `media`, `media_loans`, `media_reservations` for availability; fallback mock module retained for testing.
- **UI**: `PageHeader` hero, `UCard` grid, `UTabs`/`UButton` filters, `UInput` search, `UDialog`/`USlideover` details, empty states with `UEmpty`.
- **Behavior**: Infinite scroll via IntersectionObserver, query params forwarded to API, loading skeletons/spinners.

### 3.2 Member Dashboard (CSR, Phase B)

- **Route**: `/account/loans` (`ssr: false`, dashboard layout).
- **Data**: Supabase `media_loans`, `media_reservations` filtered by authenticated user (RLS enforced).
- **UI**: `DashboardGroup`, `UTable`, action buttons, `UNotifications`/`Toast` for renew/return feedback.

### 3.3 Librarian Desk Tool (CSR, Phase B)

- **Route**: `/desk/checkout` stepper.
- **Workflow**: `UForm` + `UInput`/`USelect` for patron and media selection; POST to checkout/checkin endpoints; display receipts via `UDialog` or toast.

### 3.4 Admin Catalog Maintenance (CSR, Phase B)

- **Routes**: `/admin/media`, `/admin/media/new`.
- **UI**: `UTable` listing, `UForm` for create/edit, optional `USlideover` for quick edits. Field set mirrors `media` table schema.

### 3.5 Debug Console & AI Pane

- **Route**: `/debug/controls` with button grid hitting health endpoints, catalog CRUD, desk flows, and AI streaming.
- **Component**: `AppAiAssistant.vue` (layouts) streaming via `useAiStream`; hidden for guests, unlocked post-auth.

## 4. Backend & Integration Strategy

- **Nuxt API routes**: `server/api/catalog/index.get.ts`, `catalog/[id].get.ts`, `media/*.ts`, `desk/checkout.post.ts`, `desk/checkin.post.ts`, `account/loans.get.ts`, `ai/recommend.post.ts`, `debug/controls/*.ts`.
- **Supabase access**: Use `supabaseServiceClient.ts` (service role) inside guarded routes; enforce `requireSupabaseSession` + role validation before mutations.
- **Query strategy**: For catalog, select metadata with availability aggregate (loan/reservation counts) and support limit/offset + filters derived from query params.
- **Auth enforcement**: Middleware ensures `requiresAuth` routes redirect to `/login`; server routes reject unauthenticated calls with 401 via `requireSupabaseSession`.
- **AI streaming**: Continue SSE pattern; ensure endpoints stay auth-gated and optionally add rate limiting.
- **Runtime toggles**: Keep `runtimeConfig.public.dataSource` for mock vs Supabase, plus `runtimeConfig.ai.mock` as a fallback.

## 5. File Layout Blueprint

```
app/
  app.vue
  layouts/
    default.vue
    dashboard.vue
  pages/
    index.vue
    catalog/index.vue
    catalog/[id].vue
    account/loans.vue
    desk/checkout.vue
    admin/media/index.vue
    admin/media/new.vue
    debug/controls.vue
    status.vue
  components/
    ui/CatalogCard.vue
    ui/StatusBadge.vue
    ui/RoleToggle.vue
    ui/AiPane.vue
    debug/ControlButton.vue
    desk/CheckoutForm.vue
    admin/MediaForm.vue
  composables/
    useCatalogData.ts
    useLoanService.ts
    useMockSession.ts (testing only)
    useAiStream.ts
server/
  api/
    catalog/index.get.ts
    catalog/[id].get.ts
    media/index.get.ts
    media/[id].put.ts
    media/[id].delete.ts
    media/post.ts
    desk/checkout.post.ts
    desk/checkin.post.ts
    account/loans.get.ts
    ai/recommend.post.ts
    check/openai.get.ts
    check/supabase.get.ts
    debug/controls/*.ts
  utils/
    supabaseServiceClient.ts
    requireSupabaseSession.ts
    openaiClient.ts
  db/
    mockData.ts (optional/testing)
```

## 6. Milestones & Timeboxes

| Milestone | Target | Output |
| --- | --- | --- |
| M1 — Public landing shell | 2 hrs | `/` hero + navbar + catalog grid rendering (mock or early Supabase) |
| M1.1 — Supabase catalog live | 45 min | `/api/catalog` + `useCatalogData` delivering paginated real data |
| M1.2 — Infinite scroll & detail modal | 45 min | Scroll append, filters, modal with auth-aware actions |
| M1.3 — Palette refresh & light/dark QA | 30 min | Updated tokens, documented contrast checks |
| M2 — Debug controls & circulation endpoints | 90 min | `/debug/controls` + checkout/checkin API responses validated |
| M3 — Member & librarian dashboards | 90 min | `/account/loans`, `/desk/checkout`, `/admin/media` wired to real endpoints |
| M4 — Enhancements | 60 min | AI polish, SQLite fallback demo, CI smoke tests |
| M5 — Documentation & capture | 30 min | Specs updated (`spec-*`, `llm-training-cutoff-updates`), screenshots/video |

## 7. Swap-In Strategy for Supabase & Auth

- **Data contracts**: Interfaces in composables mirror Supabase tables so mocks can hot-swap with live data without refactors.
- **Service layer**: All UI data flows through Nuxt server routes (`$fetch`) allowing server-side pagination, caching, and RLS compliance.
- **Auth UX**: `AuthPanel` handles login/register; magic-link hashes consumed via `supabase-auth.client.ts`. Guests hitting protected actions trigger the modal instead of backend calls.
- **Role enforcement**: `requireSupabaseSession` returns the Supabase user/session; mutation routes verify role claims (member vs librarian vs admin) before continuing.
- **Environment hygiene**: Keep secrets in `runtimeConfig.server`; ensure Vercel env variables stay synced.

## 8. Open Questions / TODOs

- Finalize the light-mode friendly palette proposal (spin up `docs/dev/style-new-proposal.md` with contrast metrics) and schedule the redesign implementation.
- Decide whether to keep `useState` composables or introduce Pinia once Supabase interactions expand.
- Confirm Tailwind v4 configuration against Nuxt 4 guidance (log deviations in `llm-training-cutoff-updates.md`).
- Add accessibility sweep checklist (focus outlines, ARIA labels, color contrast) post M1.3.
- Capture deployment smoke tests for `/`, `/catalog`, `/status`, `/debug/controls`.
- Document any friction points with Nuxt UI components so future contributors know when we resorted to raw Tailwind.

---

_Update this document as milestones land. When new learnings emerge (Nuxt UI quirks, Tailwind token tweaks, Supabase RLS adjustments), record them here and in the agent context for fast onboarding._
