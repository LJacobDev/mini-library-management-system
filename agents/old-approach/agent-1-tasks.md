# Agent 1 – Backend, Data, and API Responsibilities

**Role focus:** Own the data model, Supabase integration, Nitro server routes, and shared API adapter contracts so other agents can safely build UI and automation on top. Deliver quickly but keep tests and docs aligned with `docs/dev/spec/spec-final.md`.

## Operating principles

1. **Spec adherence first.** Every route, schema change, and response shape must match `spec-final.md` (sections 3, 4.1–4.4, 9).
2. **Edge-case-first TDD.** Before writing implementation code, jot down edge cases from `docs/dev/edge-case-checklist.md`, encode them into tests, and run them frequently.
3. **Demo-friendly shortcuts allowed.** Prefer mocks (e.g., contact form acknowledgement) and seed data over full automation when speed helps, but always document placeholders.
4. **Clear hand-offs.** Publish contract updates (OpenAPI, TypeScript interfaces, seed data) immediately so Agent 2 and Agent 3 can unblock work.

## Step-by-step tasks

Use the GitHub CLI workflow in `agents/implementation-guide.md` (issue → branch → tests → PR). Mark each `[ ]` as `[x]` when complete; if a bullet feels too large, split it into an additional checkbox before starting work.

### 1. Establish Supabase foundations

- [ ] Cross-check `docs/data/schema.sql` against `spec-final.md` §3.3/§9.
- [ ] Document any schema gaps or TODOs in `docs/dev/backend-notes.md` before editing.
- [ ] Run `supabase db diff` to generate migrations from the confirmed schema and save them to `db/migrations/<timestamp>_*.sql`.
- [ ] Add or update an `npm run db:migrate:local` script (wrapping the Supabase CLI).
- [ ] Document the migration command in `README.md`, coordinating wording with Agent 3.
- [ ] Scaffold `scripts/db/seed.ts` with schema-driven contracts and TODO markers for production-quality seed data.
- [ ] Drop lightweight JSON fixtures (catalog, members, loans) for Agent 2 to consume via mocks.

**Dependency:** None; kick off immediately.

### 2. Environment configuration alignment

- [ ] Audit `.env.example` against spec §12–13, adding any missing keys (`SUPABASE_URL`, AI configuration, demo toggles).
- [ ] Annotate `.env.example` with inline comments clarifying required vs. optional keys.
- [ ] Update or create `docs/dev/env.md`, outlining which variables need real secrets vs. demo placeholders and linking to Supabase/Vercel setup steps.
- [ ] Notify Agent 3 (via context/tasks) when env changes land so CI secrets stay aligned.

**Dependency:** Step 1 (migrations) recommended before finalizing env guidance.

### 3. API adapter contracts & mocks

- [ ] Lock Zod schemas in `~/lib/api/types.ts` for core models (`MediaSummary`, `LoanRecord`, `ReservationRecord`, `RecommendationPrompt`, `RecommendationResponse`, `PaginatedResponse<T>`).
- [ ] Add unit tests that validate sample payloads against each schema (happy path + failure cases) and snapshot the contract if practical.
- [ ] Implement `~/lib/api/client.ts` with methods that mirror the OpenAPI contract, returning typed stubs wired to `fetch`.
- [ ] Cover the client with tests ensuring request URLs, methods, and error envelopes align with the spec.
- [ ] Build `createMockApiClient` fixtures (catalog list, overdue loan, reservation queue, AI stream) and confirm Agent 2’s needs are covered.
- [ ] Document how to swap between mock and live client (README + `docs/dev/backend-notes.md`).
- [ ] Regenerate/update `docs/api/openapi.yaml` and post the delta + migration notes for Agents 2 & 3.

**Dependency:** Step 1 must have schema decisions locked; Agent 2 blocked until this lands.

### 4. Nitro server route scaffolding

- [ ] Create placeholder route handlers under `server/api/**` for every endpoint listed in spec §6, with Zod input validation and `501` TODO responses.
- [ ] Add smoke tests confirming each route exports and responds with `501` while TODOs remain.
- [ ] Implement shared error translation helpers in `~/lib/api/errors.ts` to enforce the `{ success, error }` envelope contract.
- [ ] Cover error helpers with unit tests (e.g., maps Supabase errors → spec codes).
- [ ] Add Vitest route tests that assert error envelopes and status codes for invalid payloads.

**Dependency:** Step 3 (contracts) must be in place so responses match adapters.


### 5. Catalog endpoints & account surfaces

- [ ] Introduce `server/utils/supabaseServiceClient.ts` using the service-role key for server-side Supabase calls.
- [ ] Add unit tests confirming the service client selects the correct Supabase project/role per environment variables.
- [ ] Ship `GET /api/catalog` with pagination, filters, queue summary hints, cache headers, and integration tests covering schema + conflict codes.
- [ ] Ship `GET /api/catalog/:id` with availability/queue summary and integration tests validating error conditions.
- [ ] Implement admin catalog `POST/PUT/PATCH` mutations with optimistic locking (`If-Match`) and duplicate handling.
- [ ] Persist audit log entries for admin catalog mutations and add regression tests around conflicting edits.
- [ ] Deliver `/api/me/loans` with SSR-friendly pagination metadata and comprehensive happy/edge-case tests.
- [ ] Deliver `/api/me/reservations` with queue metadata, pagination, and tests covering empty/expired states.
- [ ] Extend `scripts/db/seed.ts` with catalog/loan/reservation demo entries.
- [ ] Record seeded credentials and sample patron/librarian accounts in `docs/dev/backend-notes.md`.

**Dependency:** Step 4 complete; tests rely on seeded or mocked data. Coordinate with Agent 2 before altering response shapes and tag Agent 3 when audit log schema lands.

### 6. Implement circulation workflows

- [ ] Implement `POST /api/loans/checkout` with transaction safety, `loanRequestId` idempotency, and `loan_events` persistence.
- [ ] Add integration tests for checkout covering duplicate requests, missing members, and policy limits.
- [ ] Ship `PATCH /api/loans/:id/renew`, surfacing typed conflict codes for policy failures.
- [ ] Ship `POST /api/loans/:id/override` with librarian overrides and logging of who performed the action.
- [ ] Build `POST /api/loans/checkin` with reservation queue reconciliation and `handoff` metadata in the response.
- [ ] Cover checkout/renew/override/checkin flows with integration tests (replay, locking, queue advancement) and ensure audit entries are persisted.
- [ ] Update `docs/dev/backend-notes.md` with circulation business rules + conflict copy for Agent 2.

**Dependency:** Step 5 must be merged. Coordinate with Agent 3 for any new scripts required in CI (e.g., Supabase migrations/tests) and notify Agent 2 when payloads stabilise.

### 7. Implement reservation queue endpoints

- [ ] Finalize the `media_reservations` schema/migrations (position, status, expiresAt, request IDs) and apply them.
- [ ] Implement `POST /api/reservations` with locking + idempotent replay safeguards.
- [ ] Implement `DELETE /api/reservations/:id` honouring audit requirements and queue recalculation.
- [ ] Implement reservation queue `claim` endpoint with conflict codes for expired/invalid claims.
- [ ] Implement reservation queue `advance` endpoint to promote next patron in line.
- [ ] Add integration tests covering queue ordering, race conditions, and expiry windows.
- [ ] Add seed data for queued reservations (active + historical) to exercise UI states.
- [ ] Update OpenAPI/TypeScript interfaces for any reservation metadata changes and notify Agent 2.

**Dependency:** Step 6 done (loans return flows rely on reservations). Coordinate with Agent 2 when pushing queue changes so UI updates in sync.

### 8. AI recommendation backend

- [ ] Build the rate-limited OpenAI client with streaming output (`GPT-4o-mini`, SSE chunk roles) per spec §9.6.
- [ ] Add unit tests asserting rate-limit backoff, token budgeting, and error handling paths.
- [ ] Author prompt templates in `server/services/recommendations/templates.ts`, documenting demo vs. production placeholders.
- [ ] Implement a demo fallback (seeded recommendations) gated by `.env` toggle (e.g., `OPENAI_ENABLED=false`) and update `.env.example`.
- [ ] Add MSW/mocked tests verifying streaming chunk order and the final discriminated union payload.

**Dependency:** Steps 3–7 complete. Agent 2 must have UI hooks ready; coordinate before changing chunk schema.

### 9. Final backend polish & observability

- [ ] Implement `/api/logs/client` storing client error payloads with correlation IDs + role metadata.
- [ ] Wire structured logging (`consola`) and ensure `X-Client-Request-Id` propagates through adapters + server routes.
- [ ] Add tests (unit or integration) confirming correlation IDs persist from client to server logs.
- [ ] Connect error handling to Sentry placeholders and confirm rate-limit events comply with spec limits, coordinating with Agent 3.
- [ ] Re-audit RLS policies, response envelopes, and edge-case tests; regenerate OpenAPI artifacts if needed.
- [ ] Update `docs/dev/backend-notes.md` and the OpenAPI changelog, then broadcast “backend ready” in context files.

**Dependency:** All prior steps complete.

## Coordination checkpoints

- **After Step 3:** Notify Agent 2 & 3. UI can switch from mocks to adapter; CI can import interface definitions.
- **After Step 5:** Agent 2 may replace catalog/account UI placeholders with live data; Agent 3 can add API smoke tests.
- **After Step 7:** Reservation UI and queue handling ready for Agent 2; coordinate manual test scripts with Agent 3.
- **After Step 8:** Schedule joint test session with Agent 2 to verify streaming UI; Agent 3 to integrate rate-limit monitoring.

Maintain a brief log in `agent-1-context.md` after each PR to record progress, blockers, and coordination requests.
