# Mini Library Management System — Test Plan

_Last synced with `docs/dev/spec/spec-final.md` on 2025-11-10_

## 1. Testing Objectives

- Validate every requirement in the locked specification with automated coverage where practical.
- Exercise success, failure, and edge cases (per `docs/dev/edge-case-checklist.md`).
- Keep the feedback loop fast: unit/component tests run in under 60 seconds locally; CI stays under 10 minutes.
- Provide confidence for multi-agent development by locking contracts (schemas, adapters, server routes) with reproducible fixtures.
- Prioritise **unit** and **integration** suites for the MVP milestone; defer component accessibility checks, E2E, and performance smoke tests until post-MVP unless time permits.

## 2. Test Pyramid Overview

| Layer | Tooling | Scope | Ownership |
| --- | --- | --- | --- |
| Unit | Vitest + happy-dom | Pure functions, composables, stores, utilities | All agents |
| Integration | Vitest + @nuxt/test-utils | Server routes, API adapter, Supabase mocks | Agent 1 & 2 |
| Component (post-MVP) | Vitest + Testing Library | UI states, accessibility assertions, streaming UX | Agent 2 |
| E2E (post-MVP) | Playwright | Critical journeys (browse → checkout → return) | Agent 3 |

## 3. Environments & Data

- **Local**: Nuxt dev server + Supabase CLI (or hosted project) seeded via `npm run db:seed`.
- **CI**: GitHub Actions spins up ephemeral Postgres, runs migrations + seed script, and executes the test matrix.
- **Preview/Prod**: Smoke tests only (avoid destructive mutations).

Seed dataset (`scripts/db/seed.ts`) provides deterministic fixtures for integration tests. Use UUID constants from the seed to anchor expectations (e.g., checkout flows).

## 4. Test Suites

### 4.1 Unit tests

- Location: colocated `*.spec.ts` or `tests/unit/*`.
- Focus: helpers, schema validators, retry logic, streaming utilities.
- Mocking: rely on adapter mocks and plain objects; avoid network calls.
- Minimum expectation: each public function has at least one happy-path + one, or better if more than one, edge-case test.

### 4.2 Component tests _(post-MVP priority)_

- Location: `app/components/**/__tests__` or colocated `ComponentName.spec.ts`.
- Render with `@nuxt/test-utils` to access composables (`useSupabaseClient`, `useAiChat`).
- Assertions: DOM snapshots sparingly, prefer Testing Library queries; check keyboard/focus order and `aria-live` announcements.
- Streaming UI: simulate SSE via adapter mock to validate incremental rendering and abort handling.

### 4.3 Server route tests

- Location: `tests/server/**` (to be created) or colocated with routes under `server/api`.
- Use `@nuxt/test-utils` `setupTest` helpers to invoke Nitro handlers with mocked Supabase service client.
- Validate HTTP status, envelope shape, side effects (reservations queue, audit logs).
- Include idempotency replay assertion per mutation.

### 4.4 Integration tests

- Compose adapter + server route + Supabase test client where practical.
- Leverage MSW or Supabase test harness (coming from Agent 1) to guarantee deterministic behaviour.
- Special focus on checkout/return/reservation transitions and AI streaming pipeline.

### 4.5 Accessibility checks _(post-MVP priority)_

- Integrate `vitest-axe` (or `axe-core`) into component suites for key screens.
- Minimum coverage: catalog list, media detail, account loans, AI chat panel.
- Document violations and remediation in PR descriptions.

### 4.6 Performance & smoke _(post-MVP)_

- Lightweight smoke script hitting `/api/catalog` and `/api/recommendations/suggest` once per deploy.
- Optional Lighthouse CLI run for landing page (tracked by Agent 3 when time allows).

## 5. CI Matrix

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. (Future) `npm run test:e2e`
5. `npm run build`
6. `npm run db:migrate` + `npm run db:seed` (against ephemeral DB)

Failures block the merge. PRs must surface flake rationale if tests are skipped.

## 6. Coverage Targets

- 80% line coverage on `server/api/**` and `~/lib/api/**`.
- Critical components (AI chat, reservations dashboard, checkout desk) maintain 90% branch coverage for decision logic.
- Accessibility tests executed on every CI run once the UI solidifies.

## 7. Reporting & Tooling

- Coverage reports emitted via Vitest (`--coverage`) and uploaded as CI artifact.
- Consider Codecov integration after MVP.
- Track flaky tests in `docs/tests/flakes.md` (to be created when first flake appears).

## 8. Maintenance

- Update this plan whenever the spec changes materially.
- Implementation agents log notable additions in their `agents/agentX-context.md` files; the Manager mirrors major shifts here.
- Archive deprecated flows as “Retired” appendices instead of deleting (ensures historical transparency).
