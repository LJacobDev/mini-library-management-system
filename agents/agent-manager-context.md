# Section 1 - Context added by user. LLMs do not edit this section.

## Goal of this context file

This is a markdown file meant for an LLM to be able to refer to in order to both read important notes about context and goals and instructions, but also for the LLM to write updates about the context as it changes.

This is so that both the user and the LLMs involved can read this file in order to understand the goals, state, issues, challenges, assumptions, attempts, results and findings and adjustments to approaches, in ways that will help this project be very successful and a strong portfolio piece that has no anti-patterns present.

---

# Section 2 - Manager agent context and plan (LLMs can only edit this section with developer approval)

## Project summary

Mini Library Management System (Vue 3 SPA + Supabase).

High level goals:
- Build core librarian-facing features: book CRUD, check-in/check-out, search/filter/pagination.
- Use Supabase for database and auth; use Supabase Edge Functions for any server-side logic.
- Follow TDD / edge-case-first development and keep clear API boundaries so the app can later be migrated to Nuxt with minimal friction.
- Produce a clean, accessible, well-tested demo app that can be deployed on GitHub Pages and integrates with Supabase.

## Manager responsibilities (high level)

- Produce a complete `docs/dev/spec.md` and split it into three orthogonal implementation responsibilities.
- Create the per-agent responsibility files (`/agents/agent1-responsibility.md`, `/agents/agent2-responsibility.md`, `/agents/agent3-responsibility.md`) and their corresponding context files.
- Maintain the shared context files and coordinate overlap points, API contracts, and migrations.
- Review and validate implementer agents' work against the spec (tests, lint, TDD checks).

## Current decisions (fixed)

- Frontend: Vue 3 (Composition API), SPA.
- Language: TypeScript for frontend, tests, and shared modules.
- Backend: Supabase Postgres + Auth (roles), Supabase Edge Functions for server-side logic.
- Hosting/CI: GitHub Pages for SPA + GitHub Actions for build/test/deploy pipelines.
- Development approach: TDD-first, small incremental commits on feature branches, PR reviews.
- API contract: Frontend talks to Supabase and Supabase Edge Functions only. No custom backend servers for now.

## API boundary guidance (migration-friendly)

Keep a thin data-layer abstraction in the frontend so that all Supabase client calls and Edge Function calls are centralized behind a small API module. This module must:

- Export a small set of high-level methods (e.g. listBooks, getBook, createBook, updateBook, deleteBook, checkOutBook, checkInBook, searchBooks, suggestBook).
- Return plain objects (POJOs) and throw typed errors for failure modes.
- Not leak Supabase internals outside the module (no direct `supabase` object exported across many files).
- Include mocks and a mock adapter for unit tests and for implementation agents to work offline.

These rules make it straightforward to later swap the implementation for Nuxt (server-side calls) or to substitute different server endpoints.

## Proposed agent split (3 implementation agents)

- Agent 1 — Data & API layer + Supabase schema
  - Design and commit the Supabase table schema and RLS policies.
  - Implement Edge Functions required by the spec.
  - Provide the API adapter module and mocks used by the frontend.

- Agent 2 — Frontend components & tests
  - Implement Vue components, pages, and Composition API composables.
  - Write unit tests for components and integration tests that exercise the API adapter mocks.
  - Implement accessibility checks and keyboard navigation tests.

- Agent 3 — CI/CD, deployment, QA & extras
  - GitHub Actions workflows (install, test, lint, preview build, deploy to GitHub Pages).
  - End-to-end smoke tests (happy path) and create test accounts/data seeds for QA.
  - Implement small creative extras (AI suggest feature spike, UI polish, basic analytics) if core work is complete.

Coordination rules:
- Agent 1 provides API contract (`/src/lib/api.ts` style shim) and a JSON OpenAPI-like spec mock (small) before Agent 2 starts UI work.
- Agent 2 uses the mock adapter until Edge Functions are available; when Agent 1 finishes, Agent 2 runs integration tests against the real API.
- Agent 3 sets up CI to run unit tests and integration tests on PRs; CI should fail PRs that break the contract tests.

## Open questions for user (needed before final spec)

- **Q1 (roles)** — ANSWERED: Use minimal roles only: `librarian` and `member`. We'll implement `profiles.role` + RLS and keep the system extensible for a future full RBAC migration.
- **Q2 (book metadata)** — For book metadata, confirm the minimum required fields: `title`, `author`, `isbn` (optional), `genre`, `publishedDate`, `coverUrl`, `description`. Any additions or removals?
- **Q3 (checkout behavior)** — For check-out behaviour: Should we support reservations/holds, due dates, and borrower records (who checked out the book and when), or keep it simple by toggling checked-out with an optional `borrowerId` and `dueDate`? (default: `borrowerId` + `dueDate`)
- **Q4 (auth providers)** — Do you want third-party OAuth SSO providers (Google, GitHub) configured in the spec, or only email/password sign-in via Supabase? (default: enable social providers optional)
- **Q5 (AI suggest)** — For AI suggest feature: should suggestions be run client-side (prompt + small local heuristics) or via an Edge Function (preferred for privacy and stable prompts)? (default: Edge Function calling a hosted LLM or a mockable endpoint)

Please answer question 2 next so I can finalize the schema and API shapes.

## Recent changes & state

- Stack chosen: Vue3 SPA + Supabase Edge Functions. Decision logged here.

## Short checklist / next steps for Manager

- [ ] Get answers to the Open questions above from the user.
- [ ] Finalize `docs/dev/spec.md` with iterative milestones and acceptance criteria.
- [ ] Create `/agents/agent{1,2,3}-responsibility.md` with step-by-step checkboxes.
- [ ] Create `/agents/agent{1,2,3}-context.md` starter files.
- [ ] Create a minimal `api adapter` spec and mock data used by Agent 2.

---

# Section 3 - Manager notes (LLMs can edit this section)

Use this section for manager-runner logs, brief findings, and short lived notes that help coordinate agents. Keep it compact and date each update.

- 2025-11-08: Q1 answered by user — minimal roles chosen (`librarian`, `member`). Implement minimal RBAC via `profiles.role` + RLS. TypeScript preference recorded earlier.

