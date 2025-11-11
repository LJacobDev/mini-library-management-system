# Fast Start Plan — Minimum Working Prototype

_Last updated: 2025-11-11_

This living document captures the rough plan for spinning up a super-fast, mock-friendly prototype that stays aligned with the long-term intent in `docs/dev/spec/spec-final.md`. The goal is to deliver a functional Nuxt 4 + Tailwind CSS v4 front end backed by lightweight Nuxt server routes with SQLite mocks so that we can demo the core flows and later swap in Supabase + real APIs with minimal churn.

## 1. Guiding Constraints

- **Speed first**: deliver a working UI + mocked backend in hours, not days.
- **Replaceable scaffolding**: use shapes and naming informed by the final spec so the upgrade path to Supabase-backed data is straightforward.
- **Nuxt 4 fundamentals**: SSR where it helps for catalog browsing; CSR for authenticated/role-heavy areas, matching the future route rules.
- **Tailwind CSS v4**: rely on utility-first styling with hybrids (scoped `<style>` blocks) only when Tailwind falls short.
- **Document deltas**: capture any Nuxt/Tailwind/Supabase best-practice learnings post-cutoff in `docs/dev/llm-training-cutoff-updates.md`.

## 2. Minimum Feature Surface for Prototype

### 2.1 Public Catalog Experience (SSR)

- **Routes**: `/` (landing), `/catalog`, `/catalog/:id`.
- **Data**: in-memory mock catalog seeded from `app/server/data/catalog.ts` (or similar). Shapes:
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
- **UI components**: hero card, search bar, filter chips, media grid/list using Tailwind + Nuxt UI card primitives.
- **SSR data flow**: Nuxt server route (`/api/catalog`) returns mock list; front end uses `useFetch` to render server-side for SEO.

### 2.2 Member Dashboard (CSR)

- **Route**: `/account/loans` with `csrOnly` layout stub.
- **Data**: mocked loans keyed by user id (hard-coded `member-001`).
  ```ts
  type Loan = {
    id: string;
    mediaId: string;
    title: string;
    dueDate: string;
    status: 'active' | 'overdue' | 'returned';
  };
  ```
- **Interactions**: quick renew button invokes `/api/loans/:id/renew` mock endpoint (updates JSON file/in-memory store).

### 2.3 Librarian Desk Tool (CSR)

- **Route**: `/desk/checkout` with simple stepper UI.
- **Mock workflow**: input patron card id + media id, call `/api/desk/checkout` to mutate in-memory store and return updated loan record.
- **UI**: compact form + status toasts.

### 2.4 Admin Catalog Maintenance (CSR)

- **Routes**: `/admin/media`, `/admin/media/new` (basic form).
- **Data**: reuse media mock store with create/update handlers.
- **Form model**: align with `media` table columns (`title`, `author`, `mediaType`, `status`, `summary`, `metadata` placeholder).

### 2.5 Shared AI Pane Stub

- **Component**: `AppAiAssistant.vue` with static prompt/response placeholders.
- **Future hook**: method signature `requestRecommendation({ role, query })` ready for OpenAI integration.

## 3. Mock Backend Strategy

- **Storage**: start with plain TypeScript modules exporting state; optionally persist to SQLite using `better-sqlite3` for the “hello backend” milestone.
- **Nuxt server routes**: colocated in `server/api/*`. Example:
  - `GET /api/catalog` → list summary cards.
  - `GET /api/catalog/:id` → detail view data (include availability, description, mock hold queue length).
  - `POST /api/loans/:id/renew` → returns updated loan object.
  - `POST /api/desk/checkout` → fakes checkout logic (validates availability, toggles status, returns receipt payload).
- **SQLite bridge milestone**: add `/api/debug/sqlite-check` route that queries a local SQLite DB (seeded via `/server/db/seed.ts`) to verify SSR/backend plumbing. Response shape mirrors future Supabase data envelope: `{ success: boolean, data?: T, error?: { code: string; message: string } }`.

## 4. Front-End Structure

- **Layouts**:
  - `default` layout: top nav + role placeholder switcher.
  - `dashboard` layout: responsive sidebar for member/librarian/admin routes.
- **Composables**: `useMockSession()` to emulate role switching; `useCatalog()` for shared fetching logic.
- **Components directory**: `app/components/ui/*` for cards, status badges, button variants; `app/components/desk/*`, `app/components/admin/*` for feature slices.
- **State management**: rely on Nuxt `useState` for mock session + data caches.

## 5. Roadmap & Milestones

| Milestone | Description | Target Output |
| --- | --- | --- |
| M1 — Skeleton UI | Landing, catalog grid, static data cards | Routes render with mocked `useFetch` data |
| M2 — Interactive mock flows | Member dashboard renew button + librarian checkout form hitting in-memory API routes | Buttons trigger toast feedback | 
| M3 — Admin CRUD stubs | Form-driven create/update with validation hints | Updates reflect immediately in mock store | 
| M4 — SQLite sanity check | `/debug` page calling Nuxt server route that queries SQLite | Button on UI executes query, shows result |
| M5 — Documentation sync | Note architecture + learnings in `spec-fast-start.md` and update `llm-training-cutoff-updates.md` as needed | Repo docs reflect quick-start approach |

## 6. Swap-In Strategy for Supabase Phase

- **Data contracts**: keep TypeScript interfaces matching the future Supabase tables so we only replace implementations.
- **Service layer**: abstract data calls via composables (`useCatalogService`, `useLoanService`, etc.) that currently call mock endpoints.
- **Auth upgrade path**: `useMockSession` mirrors shape of `Session` + `Profile` objects to ease replacement with Supabase auth client.
- **Env handling**: even in prototype, place API keys/config placeholders in `runtimeConfig` to simplify future injection.

## 7. Open Questions / TODOs

- Confirm Tailwind v4 setup steps vs. existing project config; document any divergence.
- Decide whether to use Pinia for mock state or continue with `useState` until Supabase integration.
- Determine minimum accessibility pass (focus states, ARIA tags) for prototype release.
- Capture screenshots/walkthrough once M2 is complete for stakeholder alignment.

---

_This document is intentionally lightweight. Update it as we iterate, keeping focus on rapid delivery while laying tracks for the full spec implementation._

## 8. Supabase + OpenAI Fast-Track Alignment

- **Earliest “hello Supabase”**: target immediately after Milestone M1 (skeleton UI renders). Introduce a guarded `server/api/health/supabase.get.ts` that uses the Supabase service client with the `mlms-demo` instance to fetch `select 1` (e.g., `supabase.rpc('ping')` once created). Front end surfaces this via a `/debug/data` page button so we can validate environment variables, Route Rules, and SSR interplay without blocking on mock data replacement.
- **Dual-source data**: keep mock composables as default, but add `runtimeConfig.public.dataSource = 'mock' | 'supabase'`. This allows flipping to live queries route-by-route while we stabilize UI wiring.
- **Session bridge**: wire the Supabase client plugin early (alongside `useMockSession`) so auth-ready code paths exist, even if we keep using hard-coded roles until after the “hello live” check.
- **OpenAI streaming checkpoint**: as soon as the Nuxt backend can hit Supabase (same sprint as the health check), stand up `server/api/ai/recommend.post.ts` that proxies a streaming `client.chat.completions.create({ stream: true })` call. Begin with OpenAI mock responses if keys are unavailable, but aim to flip to the real API once secrets are in place to validate SSE plumbing end-to-end.
- **Timeline tweak**: insert micro-milestones `M1.5 — Supabase handshake` and `M1.6 — OpenAI SSE probe` between M1 and M2, ensuring live integrations happen before we invest in richer dashboard interactions.

## 9. Minimal File Layout for Live Data + Streaming AI

Taking cues from the `.temp/` React + FastAPI SSE example, the Nuxt project can use the following minimal structure to replicate the event-streaming pattern while staying Nuxt-conventional:

- `app/`
  - `layouts/`
    - `default.vue` — nav shell with debug badge showing Supabase/OpenAI status.
    - `dashboard.vue` — sidebar layout for member/librarian/admin screens.
  - `pages/`
    - `index.vue`, `catalog/index.vue`, `catalog/[id].vue` — SSR catalog pages hitting `/api/catalog`.
    - `debug/data.vue` — buttons triggering Supabase health check and AI stream demo.
    - `account/loans.vue`, `desk/checkout.vue`, `admin/media/index.vue`, `admin/media/new.vue` — CSR dashboards.
  - `components/ui/`
    - `CatalogCard.vue`, `StatusBadge.vue`, `RoleToggle.vue`, `AiPane.vue` (listens to SSE endpoint, similar to `.temp/src/pages/index.tsx`).
  - `composables/`
    - `useCatalogService.ts` — wraps `useFetch` to `/api/catalog` (mock vs Supabase toggle).
    - `useAiStream.ts` — establishes `EventSource` to `/api/ai/recommend` and exposes reactive buffers, mirroring the `.temp` EventSource logic.

- `server/`
  - `api/catalog/index.get.ts` — returns media list from mock store or Supabase view.
  - `api/catalog/[id].get.ts` — returns detail payload.
  - `api/health/supabase.get.ts` — “hello Supabase” endpoint hitting `mlms-demo`.
  - `api/ai/recommend.post.ts` — streaming OpenAI proxy using `sendStream(event, readable)` and chunking responses into SSE frames.
  - `api/loans/[id]/renew.post.ts`, `api/desk/checkout.post.ts` — mutable routes against mock/Supabase data.
  - `utils/supabaseServiceClient.ts` — encapsulates service-role initialization for server handlers.
  - `utils/openaiClient.ts` — wraps OpenAI SDK configuration (model, streaming options, SSE formatter akin to `.temp/api/index.py`).
  - `db/mockData.ts` & `db/sqlite.ts` — fallback stores until Supabase tables are fully adopted.

- `config/`
  - `runtime.ts` — centralizes `runtimeConfig` typing for Supabase keys, OpenAI keys, and the `dataSource` toggle.

This layout keeps the streaming/OpenAI plumbing parallel to the `.temp` FastAPI example while leveraging Nuxt server routes and composables so we can later replace internals with Supabase and Supabase Edge Functions without reorganizing files.

## 10. End-to-End Fast Track — Single-Pass Execution Plan

Follow this sequence to assemble the UI, backend, database touchpoints, and AI streaming with minimal backtracking. Each step references the relevant sections above so you can double-check details without rereading the entire document.

1. **Bootstrap UI shell (M1)**
  - Scaffold layouts (`default`, `dashboard`) and primary routes (`/`, `/catalog`, `/catalog/:id`).
  - Plug in Tailwind v4 + Nuxt UI primitives, render static catalog cards using mock data (`§2.1`, `§4`).

2. **Toggle-aware data composables**
  - Implement `useCatalogService`, `useLoanService`, `useMockSession` using in-memory mocks (`§2`, `§4`).
  - Introduce `runtimeConfig.public.dataSource` flag with defaults to `mock` (`§8`).

3. **Wire mock API routes**
  - Add server handlers for catalog, loans, desk checkout (`§3`).
  - Validate SSR/CSR separation by ensuring `/catalog` renders via `useFetch`, while dashboard routes lazily fetch client-side.

4. **Insert Supabase handshake (M1.5)**
  - Configure service client helper (`server/utils/supabaseServiceClient.ts`).
  - Build `/api/health/supabase.get` hitting `mlms-demo` and surface it on `/debug/data` button (`§8`, `§9`).
  - Record any setup deltas in `llm-training-cutoff-updates.md`.

5. **Bring OpenAI streaming online (M1.6)**
  - Create `server/utils/openaiClient.ts` and `/api/ai/recommend.post` with SSE wrapper patterned after `.temp/api/index.py` (`§8`, `§9`).
  - Build `useAiStream` composable + `AiPane` component to display streamed output on `/debug/data` (`§9`).

6. **Upgrade UI interactions (M2)**
  - Attach renew + checkout actions to respective buttons, using mock mutations or Supabase depending on toggle.
  - Add toast/snackbar feedback via Nuxt UI.

7. **Admin CRUD scaffolding (M3)**
  - Implement `/admin/media` list and `/admin/media/new` form, persisting to mock store/Supabase service.

8. **SQLite bridge sanity check (M4) [optional once Supabase live]**
  - If needed for local dev parity, maintain `server/db/sqlite.ts` and a `/api/debug/sqlite-check` button.

9. **Documentation + alignment (M5)**
  - Update this file with learnings, sync `llm-training-cutoff-updates.md`, capture screenshots for stakeholders.

Cross-check: every bullet above maps back to prior sections (`§2`–`§9`), ensuring no earlier detail is dropped. Use this condensed runbook for rapid execution, and refer upward when deeper context is required.
