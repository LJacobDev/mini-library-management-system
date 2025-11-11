# Agent 3 – DevOps, QA, and Documentation Responsibilities

**Role focus:** Deliver reliable tooling, automation, and documentation so the demo deploys quickly and confidently, all while staying aligned with `docs/dev/spec/spec-final.md`.

## Operating principles

1. **Spec alignment.** Prioritise sections §12–15 covering environments, CI/CD, operations, and testing; escalate drift immediately.
2. **Enable TDD.** Ensure tooling/tests unblock Agents 1 & 2 so edge-case-first workflows stay practical.
3. **Document every change.** Update `README.md`, `docs/dev/*`, and context files so onboarding stays frictionless.

## Step-by-step tasks

Use the GitHub CLI workflow in `agents/implementation-guide.md` (issue → branch `agent3/issue-###-slug` → tests → PR). If a checkbox feels oversized, split it into smaller child checkboxes before starting work.

### 1. CLI and tooling baseline

- [ ] Verify GitHub CLI, Supabase CLI, and Vercel CLI requirements; document install/update steps in `README.md` (Windows/macOS/Linux) with links.
- [ ] Add or update npm scripts for lint, typecheck, test, build, db migrate/reset in `package.json`, ensuring `npm run` commands match the spec.
- [ ] Cross-check `.github/ISSUE_TEMPLATE` and PR template expectations in `docs/dev/dev-process.md`; add missing references or TODOs.
- [ ] Sweep `docs/dev/spec` and other guides so all command examples use `npm` (no `yarn`/`pnpm`) and note the audit results in `docs/dev/operations.md`.

**Dependency:** None.

### 2. GitHub Actions workflow

- [ ] Create `.github/workflows/ci.yml` following spec §13.3 (install, lint, typecheck, test, build, db migrate + seed).
- [ ] Configure a Node 20.x job with caching and Supabase service containers or mocks needed for migrations.
- [ ] Document required CI secrets (`SUPABASE_DB_URL`, `OPENAI_API_KEY`, etc.) in `README.md` and ensure placeholders exist in repository settings notes.
- [ ] Add CI status badge(s) to `README.md` and note how Vercel preview deployments will surface once connected.

**Dependency:** Agent 1 Step 1 migrations should exist before enabling migration steps; coordinate timing.

### 3. Branch protections & release notes

- [ ] Document branch protection rules in `docs/dev/operations.md` (require CI success + review for `main`).
- [ ] Create `docs/dev/release-notes.md` with initial entry (e.g., “Spec locked”) and guidance for updating after each milestone.
- [ ] Write rollback guidance covering Vercel redeploy and Supabase migration rollback, linking to relevant CLI commands.

**Dependency:** None, but align with Step 2 outputs.

### 4. Environment onboarding

- [ ] Author `docs/dev/env-setup.md` describing `.env.example` → `.env.local` flow, Supabase/Vercel secret commands, and demo toggles.
- [ ] Add scripts `npm run env:check`, `npm run db:reset`, `npm run db:seed` wrapping Supabase CLI + seed script, and ensure CI invokes `env:check`.
- [ ] Notify Agents 1 & 2 via their context files and manager log when env docs/scripts land; highlight any key changes.

**Dependency:** Prefer Steps 1–2 complete so scripts align with tooling + CI.

### 5. Testing infrastructure

- [ ] Configure Vitest + @nuxt/test-utils in `vitest.config.ts` (or confirm existing config) with aliases matching Nuxt 4 conventions; document usage in `tests/unit/README.md`.
- [ ] Scaffold integration test harness `tests/integration/setup.ts` to spin up Supabase test instance or MSW mocks, including teardown utilities.
- [ ] Add Playwright configuration `tests/e2e/playwright.config.ts` with TODO markers and include optional steps in `tests/test-plan.md`.

**Dependency:** Coordinate with Agent 1 on seed data/migrations and Agent 2 on UI flow availability.

### 6. Observability & logging glue

- [ ] Implement `~/plugins/logging.client.ts` and `~/plugins/logging.server.ts` to wrap `consola`/Sentry placeholders per spec §15.
- [ ] Add `~/lib/telemetry/trace.ts` (or similar) to propagate `X-Client-Request-Id`; document injection points for frontend/back-end usage.
- [ ] Document log levels, `/api/logs/client` payload expectations, and manual monitoring steps in `docs/dev/operations.md`.
- [ ] Update environment docs with Sentry/Logflare DSN placeholders and toggles for local vs production logging.

**Dependency:** Agent 1 Step 8 may refine telemetry fields—sync before finalising helpers.

### 7. Manual QA checklist & runbooks

- [ ] Populate `docs/tests/manual-qa-checklist.md` with catalog search, checkout, reservation claim, and AI chat streaming flows (note current implementation status).
- [ ] Draft `docs/dev/demo-notes.md` highlighting the Demo Day script, environment toggles, and recovery tips.
- [ ] Cross-reference `docs/api/openapi.yaml` and `docs/tests/test-plan.md` in `README.md` so testers know where to look.

**Dependency:** Requires core flows from Agents 1 & 2 to be stubbed/enabled; mark incomplete sections clearly.

### 8. Final polish

- [ ] Run full CI pipeline locally (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`) and log results in `agent-3-context.md` + manager log.
- [ ] Verify CI badges render in `README.md` after first successful run and adjust wording if necessary.
- [ ] Audit repository for outdated docs, archive stale notes, and confirm Vercel preview/production settings are documented for handoff.

**Dependency:** All prior steps complete.

## Coordination checkpoints

- After Step 2: notify all agents that CI is live and request rebases to include workflow files.
- After Step 4: confirm everyone can run `npm run env:check`, `npm run db:reset`, and `npm run db:seed` successfully.
- After Step 7: coordinate cross-team manual QA session before final deploy.
- Update `agent-3-context.md` after each PR (issue #, branch, status, blockers, next action).
