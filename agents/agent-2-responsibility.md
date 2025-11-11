# Agent 2 – Frontend & UX Responsibilities

**Role focus:** Deliver Nuxt 4 UI that consumes the shared API adapter, showcases the demo flows, and implements the streaming AI chat experience. Work iteratively with short feedback loops.

## Operating principles
1. Follow `spec-final.md` (sections 3.4–5.5, 7.2, 9.2–9.6, 10).
2. Apply edge-case-first TDD using Vitest + @nuxt/test-utils for components/composables.
3. Prefer Nuxt UI + Tailwind v4 utility classes; drop to SFC `<style>` only when needed.
4. Keep demo shortcuts explicit (e.g., mocked contact form, seeded announcements).

## Step-by-step plan

Use the GitHub CLI workflow (`agents/implementation-guide.md`): issue → branch (`agent2/issue-###-slug`) → tests → PR.

### 1. Routing & auth shell
1.1. Configure `nuxt.config.ts` `routeRules` + middleware registration to match spec §3.1 (public routes SSR, dashboards CSR).
1.2. Implement middleware modules `session`, `auth`, `librarian`, and `admin` that hydrate Supabase session, guard roles, and surface friendly redirects/toasts.
1.3. Build `/login` view embedding Supabase Auth UI, applying design tokens, and handling verification banners + redirect query support.
1.4. Scaffold global header + mobile drawers (with placeholder role switcher and “Ask for recommendations” trigger) so later features snap into place.

**Dependency:** None—use adapter mocks until backend routes are ready.

### 2. Frontend scaffolding
2.1. Create `app/layouts/default.vue` and route stubs (`app/pages/index.vue`, `catalog/[id].vue`, `account/loans.vue`, `/desk/checkout.vue`, etc.) with placeholder content matching spec routes.
2.2. Configure Tailwind v4 usage (confirm `tailwindcss/preflight` + `tailwindcss/utilities` imported in `app/assets/css/tailwind.css`).
2.3. Add Nuxt plugin `~/plugins/api-client.ts` to inject the shared adapter (initially pointing to Agent 1’s mock client) and expose provide/inject token.

**Dependency:** Step 1 in place to ensure middleware loads in layouts.

### 3. Shared UI primitives
3.1. Implement `~/components/ui/AppShell.vue` (top nav, role-aware sidebar, toast region) ensuring responsive breakpoints.
3.2. Build utility components (`~/components/ui/StatusBadge.vue`, `~/components/ui/EmptyState.vue`, `~/components/ui/ConfirmDialog.vue`, `~/components/ui/FormField.vue`).
3.3. Add accessibility tests (Vitest + Testing Library) verifying keyboard focus, skip links, and ARIA labels.

**Dependency:** Step 2 complete.

### 4. Catalog experiences
4.1. Implement catalog list page: search bar, filters, pagination binding to adapter (`api.catalog.list`), skeleton loaders.
4.2. Build catalog detail page with availability badge, reservation ladder, and related media section.
4.3. Wire quick reservation CTA (opens shared modal; actual mutation waits for Agent 1 Step 7 but UI scaffolding ready).

**Dependency:** Agent 1 Step 3 (mocks) available. Replace mocks with live data once Agent 1 Step 5 delivers endpoints.

### 5. Member dashboard & history
5.1. Create member overview (`account/index.vue`) showing active loans/reservations summaries; use skeletons when API pending.
5.2. Implement `/account/loans` with tabbed filters (`active`, `history`), paginated table, renewal button hooking to adapter, and empty states.
5.3. Implement `/account/reservations` using the paginated envelope (`PaginatedReservations`); include expiry countdown, cancel button, and queue-position copy.

**Dependency:** Agent 1 Step 5 (loans/reservations endpoints). Until then, rely on mocks and mark blocked sub-steps.

### 6. Librarian circulation console
6.1. Implement `/desk/checkout` view: member lookup, media search, checkout form, and due-date override UI. Include validation edge-case tests.
6.2. Add `/desk/returns` view with scan input, reservation hand-off prompts, and override actions (disabled until Agent 1 Step 6 merges).
6.3. Surface error/resolution copy for conflict codes (`reservation_waiting`, `policy_violation`, etc.) and verify accessibility of form flows.

**Dependency:** Agent 1 Step 6 must be merged before enabling override/return actions; mark UI as “coming soon” until available.

### 7. Admin catalog management & insights
7.1. Implement `/admin/media` table with sort/filter, inventory counts, archive/unarchive quick actions, and optimistic UI.
7.2. Build `/admin/media/new` & `/admin/media/:id/edit` forms with conditional validation, `If-Match` concurrency prompts, and audit log callouts.
7.3. Add insight widgets (overdue totals, low-stock genres) fed by analytics endpoints and display audit trail links per spec copy.

**Dependency:** Dependent on Agent 1 Step 5 (admin CRUD) and Step 6 (circulation metrics). Coordinate when new fields appear.

### 8. AI chat panel
8.1. Build `~/components/ai/AiChatPanel.vue` shared by all roles; support streaming display (line-by-line with `aria-live="polite"`).
8.2. Create composable `~/composables/useAiRecommendations.ts` to call adapter’s streaming function, manage SSE events, telemetry hooks, and expose progress/error state.
8.3. Integrate panel into catalog page, librarian console, and admin insights with role-specific starter prompts (use union result from API).

**Dependency:** Requires Agent 1 Step 8 before live streaming; use mock stream fixture until then.

### 9. Notifications & observability UX
9.1. Implement toast/alert system using Nuxt UI; map backend error codes to friendly copy (consult spec §9.5).
9.2. Add placeholder contact form (mock submission) with success/failure messaging.
9.3. Wire client error boundary to POST `/api/logs/client`, ensuring correlation IDs/log levels match Agent 3 guidance.
9.4. Ensure global loading indicators and error boundaries exist for SSR fallback (e.g., `error.vue`, `loading.vue` pages).

**Dependency:** Steps 1–6 complete.

### 10. Testing & polish
10.1. Write Vitest component tests covering streaming UI, table pagination, role gates, and middleware redirects.
10.2. Implement Playwright smoke flow (optional if time) for catalog search → recommendation request → reservation cancel.
10.3. Update `docs/tests/manual-qa-checklist.md` with targeted manual steps (AI stream, reservation cancel, admin edit concurrency).
10.4. Final visual review: verify dark mode toggle (if time) or document deferral; confirm responsive breakpoints and accessibility checks.

**Dependency:** All prior steps complete; coordinate with Agent 3 for CI integration.

## Coordination checkpoints
- After Step 4: notify Agent 1 if additional selectors or payload fields are needed; tag Agent 3 if new npm scripts appear.
- After Step 8: schedule joint streaming test session with Agent 1 (backend) and Agent 3 (logging/monitoring).
- Keep `agent-2-context.md` updated after each PR with issue #, branch, status, blockers, next action.
