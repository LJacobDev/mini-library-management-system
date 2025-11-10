# CI/CD plans: Vercel + FastAPI backend (notes / draft)

Note: these are potential plans for CI/CD using a FastAPI backend and a Vue 3 frontend when hosting on Vercel. They are written as options and recommended patterns; they may be implemented only after a working prototype exists and core features are validated.

## High-level behaviour (Vercel + GitHub)

- Vercel integrates directly with GitHub and will create preview deployments automatically for every branch and pull request. Each preview has its own unique URL.
- Vercel will automatically deploy to production when you push/merge to the production branch you configure (commonly `main`).
- You can store environment variables per-environment in Vercel (Preview vs Production). Keep secrets required only for server-side use (service-role tokens, admin keys) in Vercel’s dashboard and/or GitHub Secrets.
- Recommendation: allow Vercel to handle preview/prod deploys and use GitHub Actions for CI (tests, linting, migrations) and gating merges. Optionally have Actions trigger or coordinate deploys via the Vercel API for advanced gating.

## Repo layout recommendations

- Monorepo layout (recommended for this project):
  - `/frontend` — Vue 3 + TypeScript SPA
  - `/backend` — FastAPI app (Python)
  - `/infra` or `/supabase` — migration SQL and seeds
- Vercel supports monorepos and can map each project (frontend/backend) to a separate Vercel project if desired.

## FastAPI hosting options (pros/cons)

1. Dedicated Python host (recommended)
   - Host FastAPI on Render, Fly, Railway, Cloud Run, or similar.
   - Pros: predictable runtime, fewer limits, easier to run background tasks and persistent workers.
   - Cons: extra provider to manage.

2. Vercel Serverless (possible for small APIs)
   - Vercel supports Serverless Functions and can run small FastAPI-style endpoints, but Python serverless on Vercel is more limited (cold starts, execution time limits).
   - Use only for tiny, infrequently used endpoints.

3. Hybrid
   - Frontend on Vercel, backend on a dedicated service. Use Vercel for preview deployments and the other provider for the FastAPI service.

Recommendation: Use a dedicated Python host for the FastAPI app in production. Use Vercel for the frontend (previews and production). This keeps the deployment simple and reduces surprises with serverless limits.

## CI / GitHub Actions pipeline (recommended jobs)

- Workflow triggers: `pull_request` (for PR checks / previews) and `push` to `main` (for production deploys or migration steps).

Jobs (parallel where possible):

1. test-frontend
   - Setup Node.js, install dependencies, run `lint`, `unit tests` and `type checks` (TypeScript).
   - Optionally run a11y checks and component snapshot tests.

2. test-backend
   - Setup Python, create virtualenv, install dependencies, run `pytest` and linting (flake8/ruff/mypy).
   - Tests can run against lightweight test doubles, local SQLite, or an ephemeral Supabase test project (preferred for integration tests).

3. build-frontend (optional for preview speed)
   - Build the frontend to ensure it compiles. Useful to detect build-time issues early.

4. migrations (run on main or protected branch only)
   - Run Supabase CLI migrations or SQL migration runner against a staging or production Supabase project (use secrets).
   - This job should be gated: only run after tests succeed and only on protected branches.

5. trigger-deploy (optional)
   - If you want to gate Vercel production deploys behind additional steps (migrations, manual approvals), use a GH Action that calls the Vercel Deploy API after the gating steps complete.
   - Otherwise, rely on Vercel’s automatic deploy on merge to `main`.

Notes on ordering:
- For PRs: run `test-frontend` and `test-backend` in parallel. Vercel will create a preview automatically. Use protected branch policies to require passing checks before merging.
- For merges to `main`: you can either let Vercel auto-deploy, or have Actions run migrations then call Vercel to deploy once migrations complete.

## Secrets and environment variables

- Frontend (public) may use the Supabase anon/public key — safe for client usage.
- Store Supabase service-role key, admin tokens, and migration tokens in GitHub Secrets and in Vercel environment variables for server-side processes.
- Never expose service-role keys to the browser or in client bundles.
- Use separate Supabase projects for `dev`/`staging`/`prod` where practical; store their credentials separately.

## DB migrations and schema management

- Keep SQL migrations under `/supabase/migrations` or similar.
- Use `supabase` CLI (or a migration runner) in GH Actions to apply migrations to staging/prod as needed.
- Prefer running migrations as a separate, gated job (only on `main` or via a manual workflow dispatch) to avoid accidental production migrations on incomplete builds.

## Integration / preview testing

- Use Vercel previews to manually test UI changes quickly.
- For automated preview tests, your Actions can run integration tests against a test Supabase instance (seeded automatically in the workflow) or use mocks.
- Add a lightweight smoke test that hits the frontend preview URL (or the backend preview) to ensure the preview is healthy. Use Vercel preview URLs returned by the Vercel API when needed.

## Recommended protections and policies

- Enable branch protection on `main` requiring passing CI checks before merge.
- Require PR reviews from at least one other developer if possible.
- Use protected secrets and rotate service-role keys when needed.

## Quick flows

- Fast iteration (recommended during early development):
  1. Developer pushes branch — Vercel creates preview; Actions run tests.
  2. Reviewer checks preview; CI checks must pass before merge.
  3. Merge to `main` — Vercel auto-deploys production.

- Controlled deploy (recommended when migrations/DB changes exist):
  1. Developer opens PR — preview + CI.
  2. After approval, merge triggers Actions to run migrations (on staging or prod depending on workflow) and then trigger production deploy via Vercel API.

## Useful integrations / tips

- Use Vercel’s GitHub integration for simple preview and production deploys.
- Use Vercel Environment Aliases to map branches to specific environments if necessary.
- Consider adding a very small GH Action that posts status updates to Slack or creates a short release note on production deploys.

## Example next steps (practical)

- Create a minimal `ci.yml` in `.github/workflows` with `test-frontend` and `test-backend` jobs, running on `pull_request` and `push` to branches.
- Configure Vercel project and connect it to the GitHub repo (enable preview deployments).
- Add required environment variables to Vercel (Preview and Production) and to GitHub Secrets for Actions.
- Decide where to host FastAPI (Render/Fly/Railway recommended). Add deployment steps for the backend in a separate workflow or via the host's GitHub integration.

---

If you want, I can draft a concrete example `ci.yml` (GitHub Actions) that includes the jobs above and a sample `trigger-deploy` step that calls the Vercel API. Which would you like next?