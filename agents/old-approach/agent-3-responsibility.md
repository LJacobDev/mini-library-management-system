# Agent 3 – DevOps, QA, and Documentation Responsibilities

**Role focus:** Deliver reliable tooling, automation, and documentation so the demo can be deployed quickly with confidence. Keep processes lightweight but aligned with `spec-final.md`.

## Operating principles
1. Follow spec sections §12–15 for environment, CI/CD, operations, and testing.
2. Maintain edge-case-first mindset by ensuring test scaffolding supports TDD for other agents.
3. Record every change in docs (`README`, `docs/dev/*`) so the team can onboard rapidly.

## Step-by-step plan

Use the GitHub CLI workflow (`agents/implementation-guide.md`): issue → branch (`agent3/issue-###-slug`) → tests → PR.

### 1. CLI and tooling baseline
1.1. Install/verify GitHub CLI, Supabase CLI, and Vercel CLI instructions in `README.md`.
1.2. Add npm scripts for lint, typecheck, test, build, db migrate/reset (`package.json`) per spec; confirm `npm run` parity across docs.
1.3. Ensure `.github/ISSUE_TEMPLATE` and PR template instructions appear in `docs/dev/dev-process.md`.
1.4. Sweep `docs/dev/spec` and other guides to confirm all command references use npm syntax.

**Dependency:** None.

### 2. GitHub Actions workflow
2.1. Create `.github/workflows/ci.yml` matching spec-final §13.3 (npm install, lint, typecheck, test, build, db migrate+seed).
2.2. Add matrix for Node 20.x (single entry is fine for demo) with cache setup.
2.3. Configure CI secrets usage (`SUPABASE_DB_URL`, `OPENAI_API_KEY` placeholders) via `README` notes.
2.4. Publish workflow badge in `README.md` and ensure CI emits preview deploy status for Vercel once configured.

**Dependency:** Requires Agent 1 Step 1 (schema/migrations) to exist before CI runs migrations.

### 3. Branch protections & release notes
3.1. Document branch protection rules in `docs/dev/operations.md` (require CI + review on `main`).
3.2. Add `docs/dev/release-notes.md` and log initial “Spec locked” entry; update after each milestone.
3.3. Provide guidance for manual rollback (Vercel redeploy, Supabase migration rollback) in operations doc.

**Dependency:** None (ties into Step 2 output).

### 4. Environment onboarding
4.1. Create `docs/dev/env-setup.md` describing copy `.env.example` → `.env`, provide Vercel/Supabase CLI commands to set secrets.
4.2. Add scripts `npm run env:check`, `npm run db:reset`, and `npm run db:seed` (wrapping Supabase CLI + seed) and integrate env check into CI.
4.3. Notify Agent 1 & 2 when env doc is published; update manager context if keys change.

**Dependency:** Step 1 (tooling) and Step 2 (CI) ideally complete.

### 5. Testing infrastructure
5.1. Configure Vitest + @nuxt/test-utils in `vitest.config.ts` (if not already) and document usage in `tests/unit/README.md`.
5.2. Add base integration test harness (`tests/integration/setup.ts`) that can spin up Supabase test instance or mock using MSW.
5.3. Stub Playwright config (`tests/e2e/playwright.config.ts`) with TODO to enable once core flows ready; mark optional in test plan.

**Dependency:** Coordinates with Agent 1 for database seeding/mocking; Agent 2 for UI smoke targets.

### 6. Observability & logging glue
6.1. Create `plugins/logging.client.ts` and `logging.server.ts` to wrap `consola` or Sentry placeholders per spec §15.
6.2. Define `~/lib/telemetry/trace.ts` helper to attach `X-Client-Request-Id` to logs; ensure backend/front-end call sites documented.
6.3. Document log levels, `/api/logs/client` expectations, and manual monitoring steps in `docs/dev/operations.md`.
6.4. Configure Sentry/Logflare DSN placeholders in environment docs and ensure toggles exist for local vs production logging.

**Dependency:** Agent 1 Step 8 (AI streaming) may add additional telemetry requirements—coordinate before finalizing.

### 7. Manual QA checklist & runbooks
7.1. Populate `docs/tests/manual-qa-checklist.md` with flows for catalog search, checkout, reservation claim, AI chat streaming.
7.2. Draft quick “Demo Day Script” in `docs/dev/demo-notes.md` covering key scenarios.
7.3. Ensure `docs/api/openapi.yaml` + `docs/tests/test-plan.md` are cross-referenced in README.

**Dependency:** Needs core UI/backend flows (Agent 1 Steps 5–8, Agent 2 Steps 3–7) to be at least stubbed before writing detailed QA steps.

### 8. Final polish
8.1. Run full CI locally (`npm run lint && npm run typecheck && npm test && npm run build`) and log results in manager context.
8.2. Verify GitHub workflow badges in README once CI runs.
8.3. Review repo for orphan docs or outdated notes; archive or flag for post-demo backlog. Confirm Vercel preview and production settings documented.

**Dependency:** All prior steps complete.

## Coordination checkpoints
- After Step 2: notify all agents CI is live; ensure they rebase to pick up `.github/workflows`.
- After Step 4: confirm everyone can run `npm run env:check`, `npm run db:reset`, and `npm run db:seed` successfully.
- After Step 7: schedule cross-team manual QA session before final deploy.
- Update `agent-3-context.md` after each PR with issue #, branch, status, next action, and blockers.
