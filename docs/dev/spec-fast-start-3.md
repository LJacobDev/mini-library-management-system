# Fast Start Plan — Minimum Working Prototype (Concise Edition)

_Last updated: 2025-11-11_

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

1. **Scaffold shell** (`app.vue`, `layouts/default.vue`, `layouts/dashboard.vue`) with `UApp`, `Header`, `Dashboard*` primitives, Tailwind tokens wired.
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
- **Env hygiene**: define `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` in `.env`, reference via `runtimeConfig`.

## 8. Open Questions / TODOs

- Tailwind v4 integration is assumed; verify config matches Nuxt 4 docs, log findings.
- Decide whether to keep `useState` or adopt Pinia once Supabase is primary.
- Accessibility sweep: focus outlines, ARIA labels, color contrast on key flows.
- Collect demo screenshots/video after M2 for stakeholders.

---

_Update this document as we execute. If Nuxt UI introduces friction, note the divergence here so future contributors understand any Tailwind-only substitutions._
