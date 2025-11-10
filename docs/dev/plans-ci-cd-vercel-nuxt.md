# CI/CD plans: Vercel + Nuxt 3 (notes / draft)

Note: these are potential plans for CI/CD when shipping a Nuxt 3 application (with optional Nitro server routes) on Vercel. They restate the FastAPI-oriented draft so it fits Nuxt-first delivery. Treat this as a menu of options to apply once the core library management features are working.

## High-level behaviour (Vercel + GitHub)

- Vercel links directly to GitHub and spins up preview deployments for every branch and pull request; each preview has a unique URL and shares the same build/runtime profile as production.
- Merging to the configured production branch (commonly `main`) triggers an automatic production deployment.
- Manage environment variables per environment (Preview vs Production) in Vercel. Keep any private keys that must only run server-side (e.g. Supabase service role, API tokens) only in Vercel or GitHub Secrets, never in the client bundle.
- Recommendation: let Vercel drive preview/prod deploys, and use GitHub Actions (or Vercel Checks) for CI gates—tests, linting, type checking, and migrations—before merges land. Optionally trigger Vercel deploys from Actions when more advanced gating is required.

## Repo layout recommendations

- Monorepo layout (recommended as the project grows):
  - `/nuxt-app` — Nuxt 3 + TypeScript project (UI, server routes, composables).
  - `/backend` — optional dedicated API (FastAPI, Nest, etc.) if the domain needs long-running workers or heavy background jobs.
  - `/infra` — SQL migrations, seeds, Terraform, Supabase CLI outputs.
- Vercel understands monorepos. Map the Nuxt project root in the Vercel dashboard (Framework Preset: Nuxt).

## Nuxt server runtime options (pros/cons)

1. **Nuxt-only (recommended for simple needs)**
   - Use Nitro server routes (`/server/api`) or server middleware for backend logic.
   - Pros: Single project, unified deployment, server endpoints run as Vercel Serverless/Edge functions automatically.
   - Cons: Limited by Vercel function constraints (execution time, cold starts); not ideal for heavy background work.

2. **Hybrid**
   - Keep Nuxt on Vercel; host a separate backend (FastAPI, Supabase edge functions, etc.) on a dedicated provider (Render, Railway, Fly.io).
   - Pros: Scales backend independently, supports background workers.
   - Cons: Additional infrastructure to manage; coordinate env vars and CORS.

3. **Dedicated API**
   - Same as the FastAPI-focused plan: Nuxt handles UI only, backend hosted elsewhere. Use this when the backend already exists or must run continuously.

Recommendation: start with Nuxt-only server routes. Switch to hybrid/dedicated when workloads exceed Vercel limits.

## CI / GitHub Actions pipeline (recommended jobs)

Triggers: `pull_request` (for checks) and `push` to `main` (for production readiness).

Jobs (parallel where possible):

1. **test-nuxt**
   - Setup Node.js (use the version in `.nvmrc` or `package.json`).
   - Install dependencies via `pnpm install`/`npm ci` (match repo tooling).
   - Run lint (`npm run lint`), unit tests (`npm run test:unit` with Vitest), component tests if using Playwright/Cypress, and type checks (`npm run typecheck`).

2. **build-nuxt** *(optional but recommended)*
   - Run `npm run build` to catch build-time/runtime config issues early.

3. **migrations** *(only when needed, and usually on protected branches)*
   - Use Supabase CLI/Prisma/Drizzle migrations from `/infra`.
   - Gate this job to only run after tests pass, and ideally only on `main`.

4. **trigger-deploy** *(optional)*
   - If deployments must wait for migrations or manual approval, call the Vercel Deploy API from Actions. Otherwise, rely on Vercel’s automatic deploy-on-merge.

Notes:
- For PRs, `test-nuxt` (and `build-nuxt` if enabled) should pass before merging; Vercel preview URLs provide manual QA.
- For `main`, either let Vercel auto-deploy or have Actions orchestrate migrations first and then hit the Vercel deploy hook.

## Secrets and environment variables

- Client-safe keys (e.g. Supabase public anon key) can live in `nuxt.config.ts` runtime config and Vercel “Environment Variables” marked as Preview/Production.
- Keep sensitive server keys (service role tokens, webhook secrets) in Vercel’s server-only env vars or GitHub Secrets. Nuxt accesses them via `process.env` or Nitro runtime config on the server side only.
- Split Supabase/third-party credentials per environment (dev/staging/prod) to avoid cross-environment contamination.

## Database migrations and schema management

- Track SQL or migration scripts under `/infra/migrations` (or `/supabase/migrations`).
- Use Supabase CLI or your migration tool in CI to validate migrations on PRs (dry run) and apply them on `main`.
- Consider preview-specific schemas or seeded databases for integration tests; tear them down at the end of the workflow.

## Integration / preview testing

- Vercel previews offer quick manual validation.
- For automated checks, run Playwright/Cypress against the preview URL using the Vercel API to fetch the deployment alias (or run Nuxt in CI with `npm run dev -- --preset=vercel` for local integration tests).
- Add a smoke test job that pings the preview URL’s health route or key pages to ensure the app booted correctly.

## Recommended protections and policies

- Protect `main` with required checks (lint/tests/build).
- Require at least one review before merging to production branches.
- Rotate service-role keys periodically; keep secrets scoped to minimum required permissions.

## Quick flows

- **Fast iteration:**
  1. Push branch ➜ Vercel preview + CI checks.
  2. Reviewer tests preview, ensures CI is green.
  3. Merge to `main` ➜ Vercel auto-deploys production.

- **Controlled deploy (with migrations or high-risk changes):**
  1. PR ➜ preview + CI.
  2. After approval, merge triggers migrations job; once done, call Vercel deploy hook (or let auto-deploy run).
  3. Optional post-deploy smoke test + Slack/Teams notification.

## Useful integrations / tips

- Enable Vercel’s GitHub integration for seamless preview/production deployments.
  - Set the framework preset to Nuxt, configure install/build commands, and specify the output directory (`.vercel/output` handled automatically).
- Use Vercel Environment Aliases to pin long-lived branches to dedicated environments (e.g. `staging`).
- Add GitHub Actions status checks to PRs that link directly to preview URLs and report smoke test results.
- Consider Sentry or Logtail for runtime logging and error tracking; configure their DSNs as environment variables.

## Example next steps

- Add `.github/workflows/ci.yml` with a `test-nuxt` job (lint, test, typecheck) and optional `build-nuxt` job.
- Configure the Vercel project to point to the Nuxt app root, set environment variables, and enable preview branches.
- Decide whether to use Nuxt server routes only or pair with a dedicated backend; document the choice in `docs/dev/dev-process.md`.
- Draft migration scripts in `/infra` and hook them into CI when the database schema stabilises.

---

If you’d like, I can now produce a sample GitHub Actions workflow file tailored to this Nuxt setup, including optional deploy gating. Let me know!"},