# Fast Start Plan — Public-First Refresh

_Last updated: 2025-11-12_

This revision folds the original fast-start roadmap together with the latest direction shift: the public catalog experience now leads, Supabase data replaces mocks as soon as possible, and librarian tooling follows once the landing page feels production-ready. Nothing from `spec-fast-start-3.md` or the agent context is dropped—items that no longer sit on the immediate path are preserved under later phases so we can resume them once the public face is polished.

## 1. Objectives & Guardrails

1. **Delight unauthenticated visitors first.** `/` becomes a welcoming catalog portal with a hero, top navigation, search/filter tooling, infinite scroll, and media detail modals. No sidebar when signed out.
2. **Serve live data quickly.** The catalog grid should hydrate from Supabase (`media` + related tables) via Nuxt server routes. Mocks remain for contingency tests only.
3. **Protect sensitive services.** AI recommendations and any mutating operations stay behind Supabase auth. Reserve attempts from guests launch the auth modal instead of hitting endpoints.
4. **Keep manual testing fast.** Add a debug console (or button panel) that can trigger CRUD/check-in/out routes with canned payloads for validation before wiring richer UI.
5. **Maintain future roadmap.** Member dashboards, librarian CRUD, desk flows, and docs/CI work stay queued—just sequenced after the public polish.

## 2. Current System Snapshot (2025-11-12)

- Nuxt 4.2 + Tailwind CSS v4 + Nuxt UI shell in place (`app/app.vue`, `layouts/default.vue`, `layouts/dashboard.vue`).
- Supabase auth + session guard (`useSupabaseAuth`, `requireSupabaseSession`, middleware) already functioning for protected routes.
- `/api/check/*`, `/api/account/loans`, and OpenAI streaming utilities operational with mocked payloads.
- `useCatalogMock` + `/pages/catalog.vue` render a mock card grid (logged); this will become the Supabase-driven view.
- Agent context tracks all milestones; latest entries cover dashboard shell and catalog mock grid.

## 3. Public-Facing Push (Phase A)

1. **Landing redesign (`/`).**
   - Build hero section (“Welcome to Great City Community Library”) with cheerful imagery (Unsplash or Supabase Storage) and CTA to explore catalog.
   - Present search + filter controls and initial catalog grid directly on the landing page (reuse catalog view without sidebar).
2. **Supabase catalog pipeline.**
   - `server/api/catalog/index.get.ts`: query `media` (join `media_loans` to surface availability), apply pagination (`limit`/`offset`) and ordering by `created_at`/`published_at`.
   - Optional `server/api/catalog/[id].get.ts` for detail modal data (include reservations/loans summary).
   - Composable `useCatalogData` that wraps `$fetch`, exposes `data`, `pending`, `error`, and supports infinite scroll (append mode).
   - Replace mock composable usage in landing + authenticated catalog pages. Keep mock helper offline for storybook/testing.
3. **Infinite scroll + filters.**
   - Use IntersectionObserver/`useInfiniteQuery` pattern: load 10–20 items per page, append on scroll.
   - Wire search input and filter chips to query params forwarded to `/api/catalog` (Supabase `ilike`, `eq` filters).
4. **Media detail modal.**
   - Clicking a card opens `UDialog`/`USlideover` showing title, cover, description, availability, and actions.
   - Guests see disabled reserve button prompting sign-in modal (`AuthPanel`); authenticated users see active `Reserve`/`Borrow` actions (stub for now).
5. **Navigation adjustments.**
   - Top navbar includes login/register button, optional theme toggle, and drawer icon for authenticated quick links (my loans, admin tools). Sidebar only in dashboard layout.
6. **Style direction.**
   - Shift Tailwind theme tokens toward a light, cheerful palette suitable for a civic library while preserving dark mode option.
   - Ensure hero, cards, and buttons reflect the updated palette.

## 4. Minimal Feature Parity (Phase B)

Focus on core functionality once the public view is complete.

1. **CRUD & circulation endpoints.**
   - Add `server/api/media` routes for list/create/update/delete (service-role Supabase client guarded by `requireSupabaseSession` + role checks).
   - Implement `server/api/desk/checkout.post.ts` and `server/api/desk/checkin.post.ts` hitting `media_loans`, `media_reservations`, and logging tables per RLS rules.
2. **Debug command panel.**
   - New route `/debug/controls` with buttons that call the endpoints above using pre-filled payloads. Show responses in a textarea/log to support manual verification.
   - Buttons should support both authenticated and unauthenticated contexts (for 401 checks) and output friendly success/failure messages.
3. **Quick librarian dashboard.**
   - Reintroduce dashboard layout for signed-in users with menu or drawer access (loans, reservations, admin catalog).
   - Initial views can be simple tabular lists with action buttons that trigger the tested endpoints.
4. **AI access gating.**
   - Confirm `/api/ai/recommend` enforces `requireSupabaseSession`. Landing page hides the assistant until sign-in; optionally add rate limiting middleware if unauthenticated access becomes desirable.

## 5. Deferred Enhancements (Phase C)

These remain from `spec-fast-start-3.md`/agent context and resume once Phases A & B are stable:

- Member dashboard with full loan/reservation history (`/account/loans`).
- Desk checkout UI flow with bar-code input, receipt, and toast notifications.
- Admin catalog management forms (`/admin/media`) using Nuxt UI tables/forms.
- Debug data toggles (mock vs Supabase), OpenAI streaming polish, SQLite fallback, CI smoke tests.
- Documentation cleanup (`spec-final`, `llm-training-cutoff-updates.md`), screenshot capture, accessibility sweep.

## 6. Implementation Notes & References

- Supabase schema, seeds, and RLS are already deployed—adhere to role expectations when building endpoints. Use `supabaseServiceClient.ts` and `requireSupabaseSession` for every server handler.
- Maintain the agent log (`agents/agent-fast-start-context.md`) with each milestone. Record any Nuxt 4/Tailwind 4/Supabase nuances in `docs/dev/llm-training-cutoff-updates.md`.
- Continue leveraging Nuxt UI primitives where they speed layout (PageHeader/PageSection/Card/Dialog/NavigationMenu). Tailwind handles bespoke styling.
- Testing approach: rely on manual runs via `/debug/controls` + browser console before crafting richer UI flows.

## 7. Immediate Next Actions Checklist

1. Build `/` landing hero + navbar per Phase A.1.
2. Implement Supabase-backed `/api/catalog` + composable; swap catalog view to live data.
3. Enable infinite scroll, filters, and detail modal with auth-aware reserve button.
4. Spin up `/debug/controls` with buttons for catalog CRUD and circulation operations (initially hitting stub endpoints until real ones are ready).
5. Document the changes (update agent context + `llm-training-cutoff-updates` if new Nuxt/Tailwind/Supabase findings emerge).

Once these are complete, proceed into Phase B for CRUD/check-in/out wiring.



# The remainder of spec-fast-start-3.md is duplicated below in order to quickly preserve any information not addressed in the above plan

# Fast Start Plan — Minimum Working Prototype (Concise Edition)

_Last updated: 2025-11-12_

This streamlined playbook blends every decision we have so far—speed-first delivery, instant Supabase/OpenAI handshakes, and Nuxt UI acceleration—into a single path you can follow to boot a working Nuxt 4 + Tailwind v4 prototype in under half a day. Treat Nuxt UI components as helpers: use them when they shorten work, fall back to raw Tailwind markup the moment they fight you.

## 1. Guiding Constraints

- **Ship fast**: reach a usable UI + mocked backend in hours; live Supabase/OpenAI checks land immediately after the first UI render.
- **Replaceable scaffolding**: data shapes mirror `docs/dev/spec/spec-final.md` so mocks swap cleanly for Supabase later.
- **Nuxt 4 discipline**: SSR for public catalog routes; CSR for dashboards. Respect route rules from the final spec.
- **Tailwind CSS v4**: default styling tool; use scoped `<style>` only for gaps.
- **Nuxt UI pragmatism**: lean on `UApp`, dashboard primitives, forms, tables, and overlays when they accelerate; bail out if configuration cost rises.
- **Documentation hygiene**: record any Nuxt/Tailwind/Supabase/OpenAI deltas in `docs/dev/llm-training-cutoff-updates.md`.

## 2. Fast-Track Checklist (do in order)

0. **Verify toolchain + first backend round-trip**
  - [x] Run `npm install`, then `npm run dev` to ensure the project boots.
  - [x] Update `app.vue` to fetch from `/api/ai/recommend` (temporarily mocked) on mount and render the JSON message in a simple `<div>`.
  - [x] Implement `/api/check/openai.get.ts` (temporary) returning `{ message: 'hello from the backend' }`; confirm the frontend displays it.
  - [x] Replace the handler with a streaming OpenAI proxy, adapting the `.temp` FastAPI example: stream completion chunks as SSE.
  - [x] Update `StatusCheckStream.vue` to consume the SSE stream and append text as it arrives.
  - [x] Create `/api/check/supabase.get.ts` returning `{ message: 'hello from database' }`; once confirmed, swap to Supabase query against `mlms-demo` (local dev creds) proving row retrieval.
  - [x] After Supabase data works, plan Supabase auth integration on the frontend so the live demo can require sign-in.
  - [x] Add server side supabase session verification and add auth verification checks to protected api endpoints
  - [x] Move the status checking main page to a /status route and clear the main route for item 1 scaffold shell

1. [x] **Scaffold shell** (`app.vue`, `layouts/default.vue`, `layouts/dashboard.vue`) with `UApp`, `Header`, `Dashboard*` primitives, Tailwind tokens wired.
  -[ ] **Fix odd most outstanding layout issues**
2. **Render catalog (SSR)**: build `/`, `/catalog`, `/catalog/[id]` using `PageHeader`, `PageSection`, `UCard`, `UTabs`; fetch mock data via `useCatalogService` + `useFetch`.
3. **Install mock session/state**: add `useMockSession`, role toggle in default layout, seed mock catalog/loans in `server/db/mockData.ts`.
4. **Member dashboard (CSR)**: `/account/loans` under dashboard layout, `UTable` + `Toast`, data from `/api/loans` mock route.
5. **Librarian desk**: `/desk/checkout` with `UForm`, `UInput`, `UButton`, calling `/api/desk/checkout` mock mutation.
6. **Admin catalog**: `/admin/media` list + `/admin/media/new` form using `UTable`, `UForm`; reuse catalog service for CRUD.
7. **Debug panel**: `/debug/data` with `UCard` buttons toggling `runtimeConfig.public.dataSource` and pinging health endpoints.
8. **Supabase handshake (M1.5)**: add `server/utils/supabaseServiceClient.ts`, implement `/api/health/supabase.get`, show nav/debug badge.
9. **OpenAI streaming (M1.6)**: create `server/utils/openaiClient.ts`, `/api/ai/recommend.post` (SSE), `useAiStream` + `AppAiAssistant` component.
10. **Interactive polish (M2)**: connect renew actions (`/api/loans/:id/renew`), add validations, optimistic updates, toasts.
11. **SQLite fallback (M4, optional once Supabase live)**: wire `server/db/sqlite.ts`, `/api/debug/sqlite-check.get`, button on debug page.
12. **Docs sync (M5)**: update this file, `spec-fast-start.md`, and `llm-training-cutoff-updates.md`; stash screenshots/walkthrough notes.
13. **Clean repo**: Organize / clean files that have been accumulating from the start so that things that are there are only things that need to be there or are left as archives to help explain history

## 3. Minimum Feature Surface (with Nuxt UI assists)

### 3.1 Public Catalog Experience (SSR)

- **Routes**: `/`, `/catalog`, `/catalog/[id]`.
- **Data**: mock array in `server/db/mockData.ts` with interface:
  ```ts
  type MediaSummary = {
    id: string;
    title: string;
    author: string;
    mediaType: 'book' | 'audiobook' | 'ebook';
    status: 'available' | 'checked_out' | 'reserved';
    tags: string[];
    coverUrl?: string;
  };
  ```
- **UI**: `PageHeader` hero + `UCard` grid, filter chips via `UTabs`/`UButton`, empty state with `Empty`.
- **Data flow**: `GET /api/catalog` served from mocks (later Supabase view); `useFetch` for SSR hydration.

### 3.2 Member Dashboard (CSR)

- **Route**: `/account/loans` (dashboard layout, `ssr: false`).
- **Data**: mocked loans keyed to `member-001`:
  ```ts
  type Loan = {
    id: string;
    mediaId: string;
    title: string;
    dueDate: string;
    status: 'active' | 'overdue' | 'returned';
  };
  ```
- **UI**: `DashboardGroup` shell, `UTable` rows, action buttons with `UButton`, feedback via `Toast`.

### 3.3 Librarian Desk Tool (CSR)

- **Route**: `/desk/checkout` stepper.
- **Workflow**: form with `UForm`, `UFormField`, `UInput`, `USelect`; POST to `/api/desk/checkout`; show receipt in `UDialog` or toast.

### 3.4 Admin Catalog Maintenance (CSR)

- **Routes**: `/admin/media`, `/admin/media/new`.
- **UI**: `UTable` list, `UForm` for create/edit, optional `USlideover` for quick edits. Fields align with `media` table columns from final spec.

### 3.5 Shared AI Pane

- **Component**: `AppAiAssistant.vue` within layouts, offering prompt input (`UTextarea`, `UButton`) and output area streaming results.
- **Future hook**: `requestRecommendation({ role, query })` resolves to real OpenAI call once keys available.

## 4. Backend & Integration Strategy

- **Mock storage**: plain modules exporting arrays; mutate in-memory for speed. Optional `server/db/sqlite.ts` for local persistence/hello world.
- **Nuxt API routes**: reside in `server/api/*`:
  - `catalog/index.get.ts`, `catalog/[id].get.ts`
  - `loans/[id]/renew.post.ts`
  - `desk/checkout.post.ts`
  - `health/supabase.get.ts`
  - `ai/recommend.post.ts` (SSE), using `event.node.res.write` or `sendStream` helpers.
- **Supabase handshake**: connect to `mlms-demo` instance ASAP (post-M1). Response contract `{ success: boolean, data?: T, error?: { code: string; message: string } }` matches future Supabase wrappers.
- **Auth enforcement**: import `requireSupabaseSession` in every mutating Nuxt server route (renewals, checkout, admin CRUD, AI writes) so unauthenticated callers receive a `401` before any Supabase query runs.
- **OpenAI streaming**: adapt `.temp/api/index.py` logic into Nuxt server route by reading `for await (const chunk of stream)` and writing `data:` frames. Keep streaming minimal yet production-ready.
- **Runtime toggles**: `runtimeConfig.public.dataSource = 'mock' | 'supabase'`; `runtimeConfig.ai.mock = boolean` to fall back if keys missing.

## 5. File Layout Blueprint

```
app/
  app.vue (wrapped in UApp)
  layouts/
    default.vue (Header, NavigationMenu, role toggle)
    dashboard.vue (DashboardGroup + sidebar)
  pages/
    index.vue
    catalog/index.vue
    catalog/[id].vue
    account/loans.vue
    desk/checkout.vue
    admin/media/index.vue
    admin/media/new.vue
    debug/data.vue
  components/
    ui/CatalogCard.vue
    ui/StatusBadge.vue
    ui/RoleToggle.vue
    ui/AiPane.vue
    desk/CheckoutForm.vue
    admin/MediaForm.vue
  composables/
    useCatalogService.ts
    useLoanService.ts
    useMockSession.ts
    useAiStream.ts
server/
  api/
    catalog/index.get.ts
    catalog/[id].get.ts
    loans/[id]/renew.post.ts
    desk/checkout.post.ts
    health/supabase.get.ts
    ai/recommend.post.ts
    debug/sqlite-check.get.ts (optional)
  db/
    mockData.ts
    sqlite.ts (optional)
  utils/
    supabaseServiceClient.ts
    openaiClient.ts
config/
  runtime.ts (aggregated runtimeConfig typing)
```

## 6. Milestones & Timeboxes

| Milestone | Target | Output |
| --- | --- | --- |
| M1 — Skeleton UI | 2 hrs | Public catalog pages render with mocked data using Nuxt UI + Tailwind |
| M1.5 — Supabase handshake | 30 min | `/debug/data` button hits `mlms-demo` via `health/supabase` |
| M1.6 — OpenAI SSE | 45 min | `/debug/data` streams OpenAI completion through `AiPane` |
| M2 — Interactive mocks | 60 min | Renew/checkout flows mutate mock store with feedback toasts |
| M3 — Admin CRUD | 60 min | Admin media forms create/update mock data instantly |
| M4 — SQLite (optional) | 30 min | SQLite query demo wired if desired |
| M5 — Docs sync | 15 min | Fast-start docs, cutoff updates, screenshots refreshed |

## 7. Swap-In Strategy for Supabase & Auth

- **Data contracts**: Interfaces from sections above match Supabase tables, easing replacement of mock services.
- **Service layer**: composables call `useFetch` on internal API routes so swapping to direct Supabase client or RLS-safe endpoints is localized.
- **Auth prep**: `useMockSession` mirrors Supabase session/profile shape; once Supabase auth is ready, replace the composable and update layouts.
- **Magic-link UX**: `app/plugins/supabase-auth.client.ts` parses the Supabase hash during module load (before Vue Router boots) and strips it while calling `setSession`, eliminating `#access_token` selector warnings on redirects.
- **Env hygiene**: define `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` in `.env`, reference via `runtimeConfig`.

## 8. Open Questions / TODOs

- Tailwind v4 integration is assumed; verify config matches Nuxt 4 docs, log findings.
- Decide whether to keep `useState` or adopt Pinia once Supabase is primary.
- Accessibility sweep: focus outlines, ARIA labels, color contrast on key flows.
- Collect demo screenshots/video after M2 for stakeholders.

---

_Update this document as we execute. If Nuxt UI introduces friction, note the divergence here so future contributors understand any Tailwind-only substitutions._
