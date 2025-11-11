# Agent 1 – Backend, Data, and API Responsibilities

**Role focus:** Own the data model, Supabase integration, Nitro server routes, and shared API adapter contracts so other agents can safely build UI and automation on top. Deliver quickly but keep tests and docs aligned with `docs/dev/spec/spec-final.md`.

## Operating principles

1. **Spec adherence first.** Every route, schema change, and response shape must match `spec-final.md` (sections 3, 4.1–4.4, 9).
2. **Edge-case-first TDD.** Before writing implementation code, jot down edge cases from `docs/dev/edge-case-checklist.md`, encode them into tests, and run them frequently.
3. **Demo-friendly shortcuts allowed.** Prefer mocks (e.g., contact form acknowledgement) and seed data over full automation when speed helps, but always document placeholders.
4. **Clear hand-offs.** Publish contract updates (OpenAPI, TypeScript interfaces, seed data) immediately so Agent 2 and Agent 3 can unblock work.

## Step-by-step plan

Each step should be executed via the GitHub CLI workflow described in `agents/implementation-guide.md` (issue → branch → tests → PR). Keep steps small; if any sub-step feels large, split it into its own issue.

### 1. Establish Supabase foundations

1.1. Review `docs/data/schema.sql` and confirm enums/tables match `spec-final.md` §3.3 and §9.
1.2. Generate Supabase CLI migrations from `schema.sql` (`supabase db diff`) and store in `db/migrations/` with timestamps.
1.3. Add a fast `npm run db:migrate:local` script (can wrap Supabase CLI) and document usage in `README.md` (coord. with Agent 3 for final docs).
1.4. Create `scripts/db/seed.ts` placeholder (schema-driven seed contract per spec §13.2); include TODOs for seeding once tables verified. Provide mock seed JSON for Agent 2 while full seed is pending.

**Dependency:** None; kick off immediately.

### 2. Environment configuration alignment

2.1. Audit `.env.example` vs spec §12–13; add missing keys (`SUPABASE_URL`, AI configs, demo defaults).
2.2. Provide a short `docs/dev/env.md` snippet (or update existing notes) describing which keys require real secrets vs. demo placeholders.
2.3. Ping Agent 3 once environment changes land so CI secrets stay in sync.

**Dependency:** Step 1 (migrations) recommended before finalizing env guidance.

### 3. API adapter contracts & mocks

3.1. In `~/lib/api/types.ts`, define/confirm Zod schemas for core models (`MediaSummary`, `LoanRecord`, `ReservationRecord`, `RecommendationPrompt`, `RecommendationResponse`, `PaginatedResponse<T>`).
3.2. Implement `~/lib/api/client.ts` interface with stubbed `fetch` calls returning mocked data but matching OpenAPI responses.
3.3. Provide `createMockApiClient` in `~/lib/api/mocks.ts` with deterministic fixtures (catalog list, loan with overdue example, reservation queue, AI stream stub). Coordinate with Agent 2 for fixture needs.
3.4. Update `docs/api/openapi.yaml` if schemas evolved, then notify both agents.

**Dependency:** Step 1 must have schema decisions locked; Agent 2 blocked until this lands.

### 4. Nitro server route scaffolding

4.1. Create route files under `server/api/` for each path in spec §6 (catalog, loans, reservations, account, AI) returning `501` placeholders but validating input via Zod.
4.2. Wire shared error helpers (`lib/api/errors.ts`) to translate exceptions into `{ success: false, error }` envelopes following spec §7.2 & §9.5.
4.3. Add minimal Vitest tests ensuring every route responds with the correct envelope and HTTP code when called with invalid payloads.

**Dependency:** Step 3 (contracts) must be in place so responses match adapters.

### 5. Implement catalog & account endpoints

5.1. Connect Supabase client for server use (`server/utils/supabaseServiceClient.ts`) using service-role key from runtime config.
5.2. Implement `/api/catalog` & `/api/catalog/:id` with pagination, filtering, queue summary, respecting caching hints (spec §9.2). Include integration tests hitting an in-memory Supabase or mocked responses.
5.3. Implement `/api/me/loans` and `/api/me/reservations` (spec §9.4) with SSR-friendly pagination metadata.
5.4. Update seed script to include demo catalog, loans, reservations so Agent 2 can visualize dashboards quickly.

**Dependency:** Step 4 complete; tests rely on seeded or mocked data. Coordinate with Agent 2 before altering response shapes.

### 6. Implement circulation workflows

6.1. `/api/loans/checkout` with idempotency via `loanRequestId` and Supabase transaction locking (spec §9.3, §9.5).
6.2. `/api/loans/{id}/renew`, `/return`, `/override` with conflict/error handling per spec (`reservation_waiting`, `policy_violation`, etc.).
6.3. Ensure returning a loan triggers reservation queue reconciliation, reusing helper utilities; add tests covering queue auto-advance.
6.4. Document business rules in `docs/dev/backend-notes.md` (new file) so Agent 2 can surface messaging.

**Dependency:** Step 5 must be merged. Coordinate with Agent 3 for any new scripts required in CI (e.g., Supabase migrations/tests).

### 7. Implement reservation queue endpoints

7.1. Finalize `media_reservations` table/migrations if needed (position, status, expiresAt, request IDs).
7.2. Implement `/api/reservations` POST, `/api/reservations/{id}` DELETE, `/claim`, `/advance` with locking & idempotent replay support.
7.3. Expand seed data to showcase active + historical reservations.
7.4. Update OpenAPI + TypeScript interfaces if queue metadata changed; alert Agent 2 for UI adjustments.

**Dependency:** Step 6 done (loans return flows rely on reservations). Coordinate with Agent 2 when pushing queue changes so UI updates in sync.

### 8. AI recommendation backend

8.1. Implement rate-limited OpenAI client with streaming output per spec §9.6 (GPT-4o-mini, SSE chunk roles).
8.2. Create prompt templates under `server/services/recommendations/templates.ts`. Include comments on placeholders for demo vs. production.
8.3. Add fallback mode for demo environments without real OpenAI key (return seeded recommendations) and document toggle in `.env.example` (e.g., `OPENAI_ENABLED=false`).
8.4. Provide tests with MSW or mocked client verifying streaming chunk order and discriminated union results.

**Dependency:** Steps 3–7 complete. Agent 2 must have UI hooks ready; coordinate before changing chunk schema.

### 9. Final backend polish

9.1. Audit logs & observability: hook up structured logging (`consola`) and ensure key flows log correlation IDs.
9.2. Ensure server errors are surfaced to Sentry placeholders (Agent 3 will finalize config).
9.3. Double-check guardrails: RLS policies enabled, SSR route rules consistent, edge-case tests documented.
9.4. Update `docs/dev/backend-notes.md` and OpenAPI changelog summarizing final state, then signal green light to other agents.

**Dependency:** All prior steps complete.

## Coordination checkpoints

- **After Step 3:** Notify Agent 2 & 3. UI can switch from mocks to adapter; CI can import interface definitions.
- **After Step 5:** Agent 2 may replace catalog/account UI placeholders with live data; Agent 3 can add API smoke tests.
- **After Step 7:** Reservation UI and queue handling ready for Agent 2; coordinate manual test scripts with Agent 3.
- **After Step 8:** Schedule joint test session with Agent 2 to verify streaming UI; Agent 3 to integrate rate-limit monitoring.

Maintain a brief log in `agent-1-context.md` after each PR to record progress, blockers, and coordination requests.
