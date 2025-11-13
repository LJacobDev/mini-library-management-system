# Agent 2 – Frontend & UX Responsibilities

**Role focus:** Deliver the Nuxt 4 interface that consumes the shared API adapter, showcases demo flows, and implements the streaming AI chat experience. Iterate quickly, keep tests first, and maintain parity with `docs/dev/spec/spec-final.md`.

## Operating principles

1. **Spec compliance.** Follow `spec-final.md` (sections 3.4–5.5, 7.2, 9.2–9.6, 10) and update OpenAPI references with Agent 1 when something drifts.
2. **Edge-case-first TDD.** Write component/composable tests (Vitest + @nuxt/test-utils) before UI wiring, capturing edge cases from `docs/dev/edge-case-checklist.md`.
3. **Tailwind + Nuxt UI first.** Prefer Tailwind v4 utilities and Nuxt UI components; only fall back to scoped `<style>` when absolutely necessary.
4. **Demo transparency.** Keep shortcuts (mocked contact form, seeded announcements) clearly labeled in UI copy and context files.

## Step-by-step tasks

Use the GitHub CLI workflow in `agents/implementation-guide.md` (issue → branch `agent2/issue-###-slug` → tests → PR). Convert any oversized checkbox into additional child checkboxes before starting.

### 1. Routing & auth shell

- [ ] Review `nuxt.config.ts` route rules and note any gaps vs. spec §3.1.
- [ ] Update `nuxt.config.ts` to align SSR/CSR behaviour and register middleware entry points.
- [ ] Implement middleware modules `session`, `auth`, `librarian`, `admin` that hydrate Supabase session, enforce role guards, and surface redirect/toast messaging hooks.
- [ ] Add Vitest or unit checks confirming middleware redirects unauthenticated/unauthorised users.
- [ ] Build `/login` page embedding Supabase Auth UI, apply design tokens, and support verification banners + redirect query parameters.
- [ ] Scaffold global header + mobile navigation drawers including placeholder role switcher and “Ask for recommendations” trigger; add smoke tests for navigation focus states.

**Dependency:** None—use API adapter mocks until backend routes go live.

### 2. Frontend scaffolding

- [ ] Create `app/layouts/default.vue` and route stubs (`app/pages/index.vue`, `catalog/[id].vue`, `account/loans.vue`, `/desk/checkout.vue`, etc.) with placeholder content matching spec routes.
- [ ] Add snapshot or structural tests ensuring layout renders navigation shell without errors.
- [ ] Confirm Tailwind v4 is wired (`tailwindcss/preflight` + `tailwindcss/utilities` imports, PostCSS config) and document any Tailwind v4 quirks in `docs/dev/frontend-notes.md` (create if missing).
- [ ] Add Nuxt plugin `~/plugins/api-client.ts` injecting the shared adapter (initially pointing at Agent 1 mocks) with provide/inject token and typed composable helper.
- [ ] Write a quick unit test for the plugin/composable to verify mock client wiring.

**Dependency:** Step 1 middleware should exist so layout hydration works.

### 3. Shared UI primitives

- [ ] Implement `~/components/ui/AppShell.vue` with responsive top nav, role-aware sidebar, and toast slot regions.
- [ ] Add story or playground page to preview AppShell states (optional, mark TODO if skipped).
- [ ] Build utility components (`StatusBadge`, `EmptyState`, `ConfirmDialog`, `FormField`) ensuring consistent props/events and Tailwind tokens.
- [ ] Write component tests validating props/events contracts for each utility component.
- [ ] Add accessibility-focused tests (Vitest + Testing Library) covering keyboard focus order, skip links, ARIA labels, and toast announcements.

**Dependency:** Step 2 scaffolding complete.

### 4. Catalog experiences

- [ ] Implement catalog list page with search, filters, pagination, skeleton loaders, and adapter bindings to `api.catalog.list` mocks.
- [ ] Add unit/integration tests covering empty state, filter toggles, and pagination boundaries.
- [ ] Build catalog detail page showing availability badge, reservation ladder, related media, and queue messaging.
- [ ] Add tests ensuring detail page handles missing IDs, unavailable items, and queue edge cases.
- [ ] Wire quick reservation CTA to shared modal component (flag backend dependency so the mutation toggles on once Agent 1 Step 7 ships) and add TODO marker for enabling live mutation.

**Dependency:** Agent 1 Step 3 mock adapter available; swap to live endpoints after Agent 1 Step 5.

### 5. Member dashboard & history

- [ ] Create `account/index.vue` summarising active loans/reservations with skeleton and empty states.
- [ ] Add tests verifying summary cards render correct counts for mocked data.
- [ ] Implement `/account/loans` tabbed table (`active`, `history`) with pagination, renewal CTA, optimistic UI.
- [ ] Cover `/account/loans` with tests for tab switching, renewal errors, and empty results.
- [ ] Implement `/account/reservations` using the paginated envelope, include expiry countdown, cancel button, queue position copy.
- [ ] Cover `/account/reservations` with tests for countdown formatting, cancellation errors, and queue boundary states.

**Dependency:** Agent 1 Step 5 endpoints; rely on mocks and mark blocked checkboxes until available.

### 6. Librarian circulation console

- [ ] Ship `/desk/checkout` view: member lookup, media search, checkout form, due-date override UI.
- [ ] Write validation edge-case tests covering missing member, invalid barcode, and override paths.
- [ ] Add `/desk/returns` view with scan input, reservation hand-off prompts, and override actions (feature flag or disabled until Agent 1 Step 6 merges).
- [ ] Add tests confirming the returns view displays pending states when overrides disabled.
- [ ] Surface conflict-copy helpers for codes like `reservation_waiting`, `policy_violation` and verify accessibility for all form flows.

**Dependency:** Agent 1 Step 6 must land before enabling overrides/returns; label pending pieces clearly.

### 7. Admin catalog management & insights

- [ ] Implement `/admin/media` table with sort/filter, inventory counts, archive/unarchive quick actions, and optimistic mutations.
- [ ] Cover admin table with tests for sorting, filtering, and optimistic revert on API errors.
- [ ] Build `/admin/media/new` and `/admin/media/:id/edit` forms with conditional validation, `If-Match` concurrency prompts, and audit log callouts.
- [ ] Add tests for validation rules, concurrency conflict messaging, and happy path submissions.
- [ ] Add insight widgets (overdue totals, low-stock genres) wired to analytics endpoints or mock data, displaying audit trail links per spec copy.
- [ ] Write snapshot or regression tests ensuring insight widgets render fallback states when data missing.

**Dependency:** Agent 1 Step 5 (admin CRUD) and Step 6 (metrics) dictate data availability—coordinate field changes promptly.

### 8. AI chat panel

- [ ] Build `~/components/ai/AiChatPanel.vue` shared across roles, implementing streaming line-by-line rendering with `aria-live="polite"`.
- [ ] Add component tests verifying stream chunk rendering, loading states, and accessibility announcements.
- [ ] Create composable `~/composables/useAiRecommendations.ts` managing adapter streaming, SSE events, telemetry hooks, and error/timeout states.
- [ ] Add unit tests that mock SSE events (success, error, timeout) to validate composable state transitions.
- [ ] Integrate panel into catalog page, librarian console, and admin insights with role-specific starter prompts and smoke tests against mock stream.

**Dependency:** Needs Agent 1 Step 8 for live streaming; keep mock fixture in place until then.

### 9. Notifications & observability UX

- [ ] Implement toast/alert system using Nuxt UI, mapping backend error codes to friendly copy (spec §9.5).
- [ ] Add tests ensuring error codes map to correct messaging and toasts are screen-reader friendly.
- [ ] Add placeholder contact form (mock submission) with success/failure messaging and document the shortcut in context files.
- [ ] Wire client error boundary to POST `/api/logs/client`, ensuring correlation IDs/log levels flow per Agent 3 guidance (include Vitest coverage around logging payloads).
- [ ] Provide global loading/error fallbacks (`error.vue`, `loading.vue`) and confirm SSR-friendly suspense behaviour.
- [ ] Add coverage (tests or manual checklist) ensuring loading/error pages respect branding and accessibility requirements.

**Dependency:** Steps 1–6 must be stable.

### 10. Testing & polish

- [ ] Expand Vitest coverage: streaming UI, middleware redirects, pagination boundaries, role-guarded components.
- [ ] Add coverage summary to `agent-2-context.md` noting key specs and gaps.
- [ ] (Optional) Add a Playwright smoke script covering catalog search → recommendation request → reservation cancel.
- [ ] Update or create `docs/tests/manual-qa-checklist.md` with targeted manual scenarios (AI stream, reservation cancel, admin concurrency).
- [ ] Complete visual polish pass: responsive breakpoints, dark mode toggle (document deferral if skipped), ARIA + Lighthouse sanity checks.
- [ ] Capture before/after screenshots or notes for demo readiness (link in context file).

**Dependency:** All prior steps complete; coordinate with Agent 3 on CI wiring for new scripts.

## Coordination checkpoints

- After Step 4: notify Agent 1 if additional selectors or payload fields are needed; inform Agent 3 if new npm scripts appear.
- After Step 8: schedule joint streaming verification with Agent 1 (backend) and Agent 3 (logging/monitoring).
- Keep `agent-2-context.md` updated after each PR (issue #, branch, status, blockers, next action).
