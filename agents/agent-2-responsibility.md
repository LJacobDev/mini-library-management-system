# Agent 2 – Frontend & UX Responsibilities

**Role focus:** Deliver Nuxt 4 UI that consumes the shared API adapter, showcases the demo flows, and implements the streaming AI chat experience. Work iteratively with short feedback loops.

## Operating principles
1. Follow `spec-final.md` (sections 3.4–5.5, 7.2, 9.2–9.6, 10).
2. Apply edge-case-first TDD using Vitest + @nuxt/test-utils for components/composables.
3. Prefer Nuxt UI + Tailwind v4 utility classes; drop to SFC `<style>` only when needed.
4. Keep demo shortcuts explicit (e.g., mocked contact form, seeded announcements).

## Step-by-step plan

Use the GitHub CLI workflow (`agents/implementation-guide.md`): issue → branch (`agent2/issue-###-slug`) → tests → PR.

### 1. Frontend scaffolding
1.1. Create `app/layouts/default.vue` and route stubs (`app/pages/index.vue`, `catalog/[id].vue`, `account/loans.vue`, etc.) with placeholder content matching spec routes.
1.2. Configure Tailwind v4 usage (confirm `tailwindcss/preflight` + `tailwindcss/utilities` imported in `app/assets/css/tailwind.css`).
1.3. Add Nuxt plugin `~/plugins/api-client.ts` to inject the shared adapter (initially pointing to Agent 1’s mock client).

**Dependency:** None (use mock adapter until Agent 1 step 3 completes).

### 2. Shared UI primitives
2.1. Implement `~/components/ui/AppShell.vue` (top nav, role switcher placeholder, toast region) ensuring responsive breakpoints.
2.2. Build utility components (`~/components/ui/StatusBadge.vue`, `~/components/ui/EmptyState.vue`, `~/components/ui/ConfirmDialog.vue`).
2.3. Add accessibility tests (Vitest + Testing Library) to verify keyboard focus and ARIA labels.

**Dependency:** Step 1 done.

### 3. Catalog experiences
3.1. Implement catalog list page: search bar, filters, pagination binding to adapter (`api.catalog.list`), skeleton loaders.
3.2. Build catalog detail page with availability badge, action buttons (reserve/check out disabled state), and related media section.
3.3. Wire quick reservation CTA (opens shared modal; actual mutation waits for Agent 1 Step 7 but UI scaffolding ready).

**Dependency:** Agent 1 Step 3 (mocks) available. Replace mocks with live data once Step 5 delivers endpoints.

### 4. Member dashboard & history
4.1. Create member overview (`account/index.vue`) showing active loans/reservations summaries; use skeletons when API pending.
4.2. Implement `/account/loans` with tabbed filters (`active`, `history`), paginated table, and renewal button hooking to adapter.
4.3. Implement `/account/reservations` using the paginated envelope (`PaginatedReservations`); include expiry countdown and cancel button.

**Dependency:** Agent 1 Step 5 (loans/reservations endpoints). Until then, rely on mocks and mark blocked sub-steps.

### 5. Librarian circulation console
5.1. Implement `/librarian/checkouts` view: member lookup, media search, checkout form. Include validation edge-case tests.
5.2. Add `/librarian/returns` view with scan input, results list, and override actions (disabled until Agent 1 Step 6 completes).
5.3. Surface reservation handoff prompts when returns API responds with queue info.

**Dependency:** Agent 1 Step 6 must be merged before enabling override/return actions; mark UI as “coming soon” until available.

### 6. Admin catalog insights
6.1. Implement `/admin/media` table with sort/filter, inventory counts, and quick actions (archive/unarchive).
6.2. Add insight widgets (cards listing overdue totals, low-stock genres) using endpoints from Steps 5–7.
6.3. Ensure audit trail links follow spec copy (point to future detail modal; stub allowed for demo).

**Dependency:** Dependent on Agent 1 Steps 5–7. Coordinate when new fields appear.

### 7. AI chat panel
7.1. Build `~/components/ai/AiChatPanel.vue` shared by all roles; support streaming display (line-by-line with `aria-live="polite"`).
7.2. Create composable `~/composables/useAiRecommendations.ts` to call adapter’s streaming function, manage SSE events, and expose progress/error state.
7.3. Integrate panel into catalog page, librarian console, and admin insights with role-specific starter prompts (use union result from API).

**Dependency:** Requires Agent 1 Step 8 before live streaming; use mock stream fixture until then.

### 8. Notification & misc UX
8.1. Implement toast/alert system using Nuxt UI; map backend error codes to friendly copy (consult spec §9.5).
8.2. Add placeholder contact form (mock submission) with success/failure to show UI polish.
8.3. Ensure global loading indicators and error boundaries exist for SSR fallback (e.g., `error.vue`, `loading.vue` pages).

**Dependency:** Steps 1–4 complete.

### 9. Testing & polish
9.1. Write Vitest component tests covering streaming UI, table pagination, and role-specific gates.
9.2. Implement Playwright smoke flow (optional if time) for catalog search → recommendation request.
9.3. Update `docs/tests/manual-qa-checklist.md` with targeted manual steps (AI stream, reservation cancel).
9.4. Final visual review: verify dark mode toggle (if time) or document deferral.

**Dependency:** All prior steps complete; coordinate with Agent 3 for CI integration.

## Coordination checkpoints
- After Step 3: notify Agent 1 if additional selectors are needed for adapters; tag Agent 3 if new npm scripts appear.
- After Step 7: schedule joint streaming test session with Agent 1 (backend) and Agent 3 (logging/monitoring).
- Keep `agent-2-context.md` updated after each PR with issue #, branch, status, blockers, next action.
