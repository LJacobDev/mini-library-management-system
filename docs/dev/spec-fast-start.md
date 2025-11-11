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
