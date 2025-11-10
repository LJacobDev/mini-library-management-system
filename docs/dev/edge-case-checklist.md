## Edge-case-first checklist for code-generation agents

> Stack note (2025-11-10): The front end runs on Nuxt 4.2 with Tailwind CSS v4. When tests reference styling behaviour (snapshot assertions, visual regressions, CSS tokens), ensure they align with the v4 directives (`tailwindcss/preflight` + `tailwindcss/utilities`) and raise a regression alert if a dependency downgrade attempts to reintroduce Tailwind v3 scaffolding.

Purpose: Always prioritize edge cases. For any new feature/function/endpoint/handler, run through this checklist first, generate tests that cover applicable items, then implement code until tests pass. Tests must assert correct handling of success cases, failure cases, invalid inputs, and resource/state edge conditions.

Usage rules for the agents:
1. Before writing production code, produce a short mapping of which checklist items apply to the requested change and why.
2. Auto-generate unit and/or integration tests that cover every applicable checklist item.
3. Implement the feature only after tests exist. Iterate until all tests pass.
4. Tests must validate both normal behaviour and explicit error paths (including boundary, timeout, concurrency, auth/permission, and resource-exhaustion cases).
5. Keep tests deterministic and isolated (use mocks/fakes/time control/temp DBs as needed).
6. When applicable, generate minimal fixtures and setup/teardown code in tests.
7. Provide a brief summary of assumptions and any trade-offs made.

Checklist categories (apply relevant items):

1) Input validation & types
- Validate required vs optional fields.
- Type/shape checks (string, number, array, object).
- Trim/normalize inputs (whitespace, Unicode normalization).
- Reject or sanitize control characters and extremely long inputs.
- Numeric boundaries (min/max, integer vs float).
- Enum/allowed-values enforcement.
- Unexpected keys should be ignored or cause errors (specify behavior).

2) Authentication & authorization
- Unauthenticated requests return correct error/status.
- Authenticated users with missing/expired tokens.
- Permission checks: ensure role-based and resource-based permissions enforced.
- Cross-tenant/user access attempts are denied.
- Token scope/claim validation and token revocation handling.

3) Data/state consistency
- Idempotency: repeated requests produce the same result (or return appropriate conflict).
- Race conditions: concurrent modifications, double-check update/delete semantics.
- Transactions and rollback on multi-step operations.
- Referential integrity: foreign keys, deleted parent records.
- Optimistic locking (version/ETag) and conflict resolution.
- Partial failures leave system in consistent state.

4) Boundary & size limits
- Empty inputs, zero-length arrays.
- Extremely large payloads (size limits, streaming vs memory).
- Maximum number of items (pagination limits).
- File upload size and type validation.
- Database field length limits.

5) Error handling & observability
- Return actionable error messages and correct HTTP status codes.
- Distinguish client vs server errors.
- Fail fast on invalid inputs.
- Log errors with context (without leaking secrets).
- Include correlation IDs for tracing.
- Retries: which errors are retryable vs fatal; backoff strategy documented.

6) Timeouts & performance
- Handle slow downstream services with timeouts and graceful degradation.
- Circuit-breaker or failover patterns for downstream failures.
- Ensure operations complete within acceptable latency; tests for artificial delays.
- Avoid blocking the event loop / long synchronous tasks.

7) External integrations & network
- Downstream API failures, partial responses, malformed responses.
- Network errors, DNS failures, TLS issues.
- Dependency version or schema changes — validate responses.
- Credentials rotation and invalid credentials handling.

8) Concurrency & locking
- Simultaneous requests causing conflicting state updates.
- Deadlocks and lock contention handling.
- Queuing or optimistic concurrency strategies.
- Ensure tests simulate concurrent requests where relevant.

9) Security & injection
- SQL injection, NoSQL injection, command injection tests.
- Proper parameterized queries and ORM usage.
- XSS, CSRF (for web handlers), CORS configuration tests.
- Secure storage/handling of secrets; no secrets in logs.
- Rate limiting and abuse protection.

10) Data privacy & PII
- Mask or redact PII in logs.
- Privacy-preserving defaults and consent checks where applicable.
- Data retention and deletion flows (soft delete vs hard delete).

11) Internationalization & localization
- Unicode handling, emoji, RTL languages.
- Date/time/timezone handling and formatting.
- Number/decimal separators and locale-specific parsing.

12) Determinism & reproducibility
- Tests must be deterministic: freeze time, random seeds, and external responses.
- Capture schema/migrations and ensure DB state reproducible for tests.

13) Backwards compatibility & migrations
- API versioning: non-breaking changes and deprecation strategy.
- Data migrations: tests for upgraded/downgraded schema compatibility.
- Default values for newly added fields.

14) Accessibility & UX (for UI features)
- Keyboard navigation, focus management, ARIA attributes.
- Error message visibility and form validation feedback.

15) Deployment & environment differences
- Behavior differences between dev/staging/production (env vars, secrets).
- Feature flags and rollout strategies.
- Resource limits across runtimes (edge vs lambda vs container).

16) Resource exhaustion & quotas
- DB connection limits, file descriptors, memory.
- Graceful handling when quotas reached (429 or degraded mode).
- Tests that simulate exhausted resources.

17) Observability & metrics
- Emit success/failure counters and latency histograms.
- Instrument critical paths with spans/traces.
- Ensure logs include enough context for debugging.

18) UX for failures & retries
- Idempotent retry tokens for client retries.
- Client-visible transient error handling and guidance.

19) Testing matrix
- Test combinations of: valid/invalid auth, minimal/typical/large payload, fresh/existing state, concurrent requests, downstream failures, timeout scenarios.

20) Edge-specific concerns (for edge/lambda/short-lived runtimes)
- Cold start behavior and initialization cost.
- Ephemeral filesystem availability and size.
- No assumption of long-lived global state.
- Limit on CPU/GB-time and short maximum durations.

Actionable test-generation instructions for the LLM
- For each new change, list which checklist items apply.
- Generate:
  - Unit tests for pure functions covering input validation, edge inputs, and error paths.
  - Integration tests for API endpoints covering auth, DB state changes, and downstream failures.
  - Concurrency tests (parallel requests) where state conflicts might occur.
  - Timeout/slow-down tests by mocking delays from dependencies.
  - Security tests for injection and auth bypass attempts.
- Use mocks/fakes for external services; where integration tests hit real services, provide sandbox setup and teardown.
- Create clear test fixtures and teardown to avoid shared-state flakiness.
- Prefer table-driven tests for multiple input permutations.

Example template (auto-generated per feature)
1. Applicability matrix (which checklist items apply and why).
2. Test plan outline — list of test cases mapped to checklist items.
3. Generated test files (unit + integration + concurrency).
4. Implementation files (minimal adapters + business logic) that import test-targeted modules.
5. CI step: run tests with env vars/mocks; fail build on any test failure.

Minimal enforcement rules
- Never skip test generation for applicable checklist items unless explicitly allowed by a human reviewer; require explicit justification.
- Tests must run in CI and be deterministic.
- If tests require external secrets/keys, generate instructions and a local mock server to run tests without real secrets.
- Always document any assumptions or trade-offs made during implementation.