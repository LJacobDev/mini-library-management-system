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
	- [ ] Capture minimum required versions from spec/cli docs and add them to `README.md`.
	- [ ] Confirm each CLI is installable on Windows/macOS/Linux (test or cite vendor docs).
	- [ ] Provide upgrade commands and troubleshooting notes (proxy, path, auth issues).
- [ ] Add or update npm scripts for lint, typecheck, test, build, db migrate/reset in `package.json`, ensuring `npm run` commands match the spec.
	- [ ] Inventory existing scripts; mark which align with spec.
	- [ ] Add missing scripts and ensure they pass locally once added.
	- [ ] Document each script in `README.md` tooling section.
- [ ] Cross-check `.github/ISSUE_TEMPLATE` and PR template expectations in `docs/dev/dev-process.md`; add missing references or TODOs.
	- [ ] Ensure issue template prompts for edge-case checklist + test plan links.
	- [ ] Ensure PR template references CI checklist and linked tests.
	- [ ] Note any open questions in manager context if policy gaps appear.
- [ ] Sweep `docs/dev/spec` and other guides so all command examples use `npm` (no `yarn`/`pnpm`) and note the audit results in `docs/dev/operations.md`.
	- [ ] Search for `yarn`/`pnpm` strings and replace with `npm` equivalents.
	- [ ] Update `docs/dev/operations.md` with a dated summary of changes.
	- [ ] Flag remaining mixed tooling references for follow-up if any.

**Dependency:** None.

### 2. GitHub Actions workflow

- [ ] Create `.github/workflows/ci.yml` following spec §13.3 (install, lint, typecheck, test, build, db migrate + seed).
	- [ ] Mirror local npm scripts in workflow steps (lint → typecheck → test → build → db migrate/seed).
	- [ ] Add matrix or caching directives per spec to keep runtime low.
	- [ ] Stub secrets/variables with `${{ secrets.* }}` placeholders and document where they come from.
- [ ] Configure a Node 20.x job with caching and Supabase service containers or mocks needed for migrations.
	- [ ] Decide between Service container vs. Supabase CLI + remote fallback; document choice.
	- [ ] Validate migrations run cleanly in CI context (dry-run locally using `act` or manual GH run).
	- [ ] Add artifact uploads (logs/results) if troubleshooting is needed per spec.
- [ ] Document required CI secrets (`SUPABASE_DB_URL`, `OPENAI_API_KEY`, etc.) in `README.md` and ensure placeholders exist in repository settings notes.
	- [ ] Update `.env.example` to include new CI-only variables as comments.
	- [ ] Record how to provision each secret (Supabase dashboard, OpenAI keys) with links.
	- [ ] Add reminder in manager log when secrets list changes.
- [ ] Add CI status badge(s) to `README.md` and note how Vercel preview deployments will surface once connected.
	- [ ] Use badge markdown referencing `main` branch workflow.
	- [ ] Reserve placeholder text describing Vercel preview URLs until integration lands.
	- [ ] Confirm badge renders after first successful run and screenshot if helpful for docs.

**Dependency:** Agent 1 Step 1 migrations should exist before enabling migration steps; coordinate timing.

### 3. Branch protections & release notes

- [ ] Document branch protection rules in `docs/dev/operations.md` (require CI success + review for `main`).
	- [ ] Capture current GitHub settings (required reviewers, dismiss stale reviews, etc.).
	- [ ] Note pending settings that need org-level approval if applicable.
- [ ] Create `docs/dev/release-notes.md` with initial entry (e.g., “Spec locked”) and guidance for updating after each milestone.
	- [ ] Define template for future entries (date, scope, owner, links).
	- [ ] Seed with most recent milestone summary and TODO placeholders for next items.
- [ ] Write rollback guidance covering Vercel redeploy and Supabase migration rollback, linking to relevant CLI commands.
	- [ ] Detail steps for rolling back a failed deploy (Vercel CLI + dashboard).
	- [ ] Include Supabase migration rollback commands with warnings about data loss.
	- [ ] Point to escalation contacts/process in manager context.

**Dependency:** None, but align with Step 2 outputs.

### 4. Environment onboarding

- [ ] Author `docs/dev/env-setup.md` describing `.env.example` → `.env.local` flow, Supabase/Vercel secret commands, and demo toggles.
	- [ ] Enumerate all environment variables (purpose, default, secret source).
	- [ ] Provide copy-paste commands for creating `.env.local` on Windows/macOS/Linux.
	- [ ] Include troubleshooting for missing Supabase roles or rate limits.
- [ ] Add scripts `npm run env:check`, `npm run db:reset`, `npm run db:seed` wrapping Supabase CLI + seed script, and ensure CI invokes `env:check`.
	- [ ] Stub `scripts/env-check.ts` (or similar) to validate required env vars with helpful errors.
	- [ ] Ensure `db:reset` resets local DB safely (warn about data loss).
	- [ ] Document script expectations in `tests/test-plan.md` and `README.md`.
- [ ] Notify Agents 1 & 2 via their context files and manager log when env docs/scripts land; highlight any key changes.
	- [ ] Summarise updates in `agent-3-context.md` with next steps for each agent.
	- [ ] Highlight any new prerequisites (e.g., Supabase anon key regeneration).
	- [ ] Ask for confirmation/feedback once they run the scripts.

**Dependency:** Prefer Steps 1–2 complete so scripts align with tooling + CI.

### 5. Testing infrastructure

- [ ] Configure Vitest + @nuxt/test-utils in `vitest.config.ts` (or confirm existing config) with aliases matching Nuxt 4 conventions; document usage in `tests/unit/README.md`.
	- [ ] Install `vitest`, `@nuxt/test-utils`, `happy-dom` (or `jsdom`), `@testing-library/vue`, and `vitest-axe`.
	- [ ] Mirror Nuxt aliases (`~/`, `@/`) and transpile settings in Vitest config.
	- [ ] Add sample spec demonstrating edge-case-first pattern.
- [ ] Scaffold integration test harness `tests/integration/setup.ts` to spin up Supabase test instance or MSW mocks, including teardown utilities.
	- [ ] Decide on Supabase test strategy (local docker vs. supabase CLI) and document prerequisites.
	- [ ] Implement MSW handlers for Supabase/OpenAI adapters and export helpers for tests.
	- [ ] Ensure teardown clears DB state and resets MSW between tests.
- [ ] Add Playwright configuration `tests/e2e/playwright.config.ts` with TODO markers and include optional steps in `tests/test-plan.md`.
	- [ ] Configure project for desktop + mobile viewports.
	- [ ] Add placeholder tests verifying app boots and login stub works (skip if not ready).
	- [ ] Document how to run Playwright headed/headless and where results live.

**Dependency:** Coordinate with Agent 1 on seed data/migrations and Agent 2 on UI flow availability.

### 6. Observability & logging glue

- [ ] Implement `~/plugins/logging.client.ts` and `~/plugins/logging.server.ts` to wrap `consola`/Sentry placeholders per spec §15.
	- [ ] Provide noop fallbacks when Sentry DSN is absent (local dev).
	- [ ] Surface request IDs and user session info in logs where available.
- [ ] Add `~/lib/telemetry/trace.ts` (or similar) to propagate `X-Client-Request-Id`; document injection points for frontend/back-end usage.
	- [ ] Expose helper to create/forward IDs for both fetch and server handlers.
	- [ ] Update API adapter template to consume helper.
- [ ] Document log levels, `/api/logs/client` payload expectations, and manual monitoring steps in `docs/dev/operations.md`.
	- [ ] Include example payload JSON and retention policy notes.
	- [ ] Describe manual log export flow for Supabase/Logflare.
- [ ] Update environment docs with Sentry/Logflare DSN placeholders and toggles for local vs production logging.
	- [ ] Clarify which env vars/feature flags toggle logging intensity.
	- [ ] Provide guidance for rotating DSNs/keys securely.

**Dependency:** Agent 1 Step 8 may refine telemetry fields—sync before finalising helpers.

### 7. Manual QA checklist & runbooks

- [ ] Populate `docs/tests/manual-qa-checklist.md` with catalog search, checkout, reservation claim, and AI chat streaming flows (note current implementation status).
	- [ ] Annotate each flow with preconditions (seed data, user roles) and expected results.
	- [ ] Flag unimplemented sections with TODO + owner.
- [ ] Draft `docs/dev/demo-notes.md` highlighting the Demo Day script, environment toggles, and recovery tips.
	- [ ] Include timeline cues (intro, feature tour, fallback plan).
	- [ ] Add checklist for resetting demo data between runs.
- [ ] Cross-reference `docs/api/openapi.yaml` and `docs/tests/test-plan.md` in `README.md` so testers know where to look.
	- [ ] Add quick links section under Testing/QA header.
	- [ ] Note how automated vs manual coverage interlock.

**Dependency:** Requires core flows from Agents 1 & 2 to be stubbed/enabled; mark incomplete sections clearly.

### 8. Final polish

- [ ] Run full CI pipeline locally (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`) and log results in `agent-3-context.md` + manager log.
	- [ ] Capture timestamps + git commit hash for reproducibility.
	- [ ] Attach logs/artifacts to context file if failures occur.
- [ ] Verify CI badges render in `README.md` after first successful run and adjust wording if necessary.
	- [ ] Confirm badge URL matches workflow name and branch.
	- [ ] Add note on how to regenerate badge if workflow renamed.
- [ ] Audit repository for outdated docs, archive stale notes, and confirm Vercel preview/production settings are documented for handoff.
	- [ ] Review `/docs/dev/` and `/docs/tests/` for deprecated sections; mark with `<!-- archived -->` or remove.
	- [ ] Ensure `README.md` production section references Vercel dashboard + Supabase project IDs.
	- [ ] Summarise final audit results in manager log with outstanding TODOs if any.

**Dependency:** All prior steps complete.

## Coordination checkpoints

- After Step 2: notify all agents that CI is live and request rebases to include workflow files.
- After Step 4: confirm everyone can run `npm run env:check`, `npm run db:reset`, and `npm run db:seed` successfully.
- After Step 7: coordinate cross-team manual QA session before final deploy.
- Update `agent-3-context.md` after each PR (issue #, branch, status, blockers, next action).
