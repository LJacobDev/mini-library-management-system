# Section 1 - Context added by user. LLMs do not edit this section.

## Goal of this context file

This is a markdown file meant for an LLM to be able to refer to in order to both read important notes about context and goals and instructions, but also for the LLM to write updates about the context as it changes.

This is so that both the user and the LLMs involved can read this file in order to understand the goals, state, issues, challenges, assumptions, attempts, results and findings and adjustments to approaches, in ways that will help this project be very successful and a strong portfolio piece that has no anti-patterns present.

---

# Section 2 - Manager agent context and plan (LLMs can only edit this section with developer approval)

## Project summary

Mini Library Management System coordinated via multi-agent workflow. The primary UI will be a Vue 3 Composition API client. The backend integration layer is still under evaluation between three options that must remain interoperable:

1. Vue 3 SPA that talks directly to Supabase (Postgres + Auth + Edge Functions).
2. Vue 3 SPA that talks to a FastAPI service (hosted on Vercel or similar) which in turn uses Supabase for persistence/auth.
3. Nuxt 3 full-stack (server/API routes in-repo) backed by Supabase.

High-level goals (keep stack-agnostic wherever possible):

- Deliver librarian-facing workflows for creating, browsing, searching, checking out, and checking in media items (books, DVDs/videos, audio, other lendable resources) with pagination, filtering, and sorting.
- Support multi-copy inventory: every physical/digital copy is a distinct record tracked by UUID so availability and circulation are copy-scoped.
- Follow TDD / edge-case-first development, ship comprehensive automated tests (unit, integration, accessibility), and keep the API boundary explicit so backend implementations can be swapped without rewriting the UI.
- Produce a polished, accessible, well-documented portfolio-grade demo with CI/CD, deployment pipeline, seeded demo data, and clear run instructions.

## Manager responsibilities (high level)

- Produce a complete `docs/dev/spec.md` (with milestones, acceptance criteria, AI behaviour definitions) and split work into three orthogonal responsibility tracks.
- Create `/agents/agent{1,2,3}-responsibility.md` and `/agents/agent{1,2,3}-context.md` aligned with the latest schema and requirements.
- Maintain shared context files and coordinate overlap points, API contracts, migrations, and AI prompt libraries.
- Review and validate implementer agents' work against the spec (tests, lint, TDD checks) and ensure outputs remain portfolio-ready.
- Coordinate AI-powered features (OpenAI integrations, retrieval flows, streaming UX) so that backend and frontend deliverables remain in sync and all prompts/code live in the repo.

## Current decisions (fixed)

- Frontend: Vue 3 (Composition API) confirmed. Nuxt 3 stays on the table as an alternative if server-rendered routes in-repo become advantageous.
- Language: TypeScript for frontend, tests, and shared tooling. Python (FastAPI) is acceptable if we adopt the FastAPI backend path.
- Backend: Supabase Postgres + Auth is required. The request/response handling layer (Supabase Edge Functions vs FastAPI vs Nuxt server routes) remains under evaluation; whichever we pick, all code must live in the repo (no opaque Supabase-only logic).
- Hosting/CI: GitHub Actions for build/test/deploy. Deployment target (GitHub Pages vs Vercel) stays flexible until backend architecture is locked.
- Development approach: TDD-first, small feature branches, PR reviews, deliberate agent coordination.
- API contract: Frontend must talk through a thin API adapter module exposing stable methods; no leaking raw `supabase` clients across the UI.

## API boundary guidance (migration-friendly)

Keep a thin data-layer abstraction in the frontend so that all calls to Supabase, Edge Functions, FastAPI, or Nuxt server routes are centralised. This module must:

- Export a small set of high-level methods (e.g. `listMedia`, `getMediaItem`, `createMediaItem`, `updateMediaItem`, `deleteMediaItem`, `checkOutMediaItem`, `checkInMediaItem`, `searchMedia`, `recommendMedia`, `askCollectionQuestion`).
- Return plain objects (POJOs) and throw typed errors for failure modes.
- Not leak Supabase internals outside the module (no direct `supabase` exports in components/composables).
- Include mocks and a mock adapter (including streaming simulators) for unit/integration tests and offline development.

These rules make it straightforward to swap the backend implementation without touching the UI surface area.

## Data model decisions (latest)

- Replace the book-only schema with a single generic `media` table. Supported `media_type` enum values: `book`, `video`, `audio`, `other` (extendable).
- Each physical/digital copy is its own row identified by UUID (no barcode column needed; UUID is the copy identifier).
- Required columns: `media_type`, `title`, `creator` (author/director/artist). Optional columns: `isbn`, `subject`, `description`, `cover_url`, `format` (generic string, e.g. dvd), `book_format` (ENUM `paperback`/`hardcover`, nullable), `language` (nullable, default `null`, commonly `EN`), `pages`, `duration_seconds`, `published_at`, `metadata` (jsonb for extensibility).
- Circulation columns: `checked_out` boolean, `checked_out_by` UUID, `checked_out_at` timestamptz, `due_date` timestamptz (NULL when not checked out).
- Timestamps: `created_at`, `updated_at` default to `now()`; ensure triggers or application code keep `updated_at` fresh.
- Index plan:
  - `idx_media_metadata_gin` — GIN on `metadata` for flexible key/value queries.
  - `idx_media_title_creator` — B-tree on `lower(title), lower(creator)` for case-insensitive search and dedupe detection.
  - `idx_media_subject_lower` — B-tree on `lower(subject)` to support subject filters.
  - `idx_media_media_type` — B-tree on `media_type` for quick partitioning by type.
  - `idx_media_format` — B-tree on `format` for format-based filtering.
  - `idx_media_fulltext` — GIN on `to_tsvector('english', ...)` combining title/description/subject/creator to power natural-language search and AI retrieval grounding.
  - `idx_media_checked_out` — B-tree on `checked_out` for availability queries.
  - `idx_media_due_date` — Partial B-tree on `due_date` where `checked_out = true` for overdue checks.
- Migrations live in `db/migrations` (numbered SQL files). Include `CREATE TYPE` statements for enums and separate scripts for indexes. Seed data in `db/seeds/media_seed.sql` should illustrate multiple copies and mixed media types.

## AI / LLM feature requirements

- Core capability: OpenAI-powered "describe what you want" assistant. Backend must (a) retrieve candidate media via full-text search (or vector search when available), (b) pass a concise candidate list to the model, and (c) return a JSON payload of suggested media.
- Optional enhancement: personalised recommendation lists using member checkout history (e.g., related subjects, creators). If built, re-rank via OpenAI for richer explanations.
- Librarian admin assistant: privileged users can ask questions like "How many EN-language DVDs tagged Drama are overdue?" Backend aggregates the data (SQL queries) and feeds structured context to the model so it can respond with suggestions/insights.
- Streaming responses: any endpoint returning model-generated text must stream tokens so the UI renders incremental output. Agent 2 must implement streaming chat UX with graceful fallbacks.
- Operational hygiene: redact PII before sending prompts, enforce role checks on admin endpoints, document rate limiting and cost controls, and store prompts/examples in the repo for reproducibility.

## Proposed agent split (3 implementation agents)

- Agent 1 — Data & API layer + Supabase schema
  - Design and commit schema, migrations, seeds, and RLS policies.
  - Implement Edge Functions, FastAPI endpoints, or Nuxt server routes (depending on the final choice) required by the spec.
  - Maintain the OpenAPI contract (`docs/api/openapi.yaml`) and ensure API adapter + mocks stay current, including streaming behaviour.
  - Provide retrieval helpers for AI endpoints (full-text search RPC, candidate formatting, history queries).

- Agent 2 — Frontend components & tests
  - Implement Vue components, pages, and Composition API composables.
  - Write unit tests and integration tests using the API adapter mocks.
  - Implement accessibility checks, keyboard navigation tests, and streaming chat UX.
  - Integrate recommendation/assistive flows once backend endpoints stabilize.

- Agent 3 — CI/CD, deployment, QA & extras
  - Build GitHub Actions workflows (install, lint, test, preview build, deploy) with parameters to pivot to GitHub Pages or Vercel once architecture is locked.
  - Maintain seeded data + test accounts for QA and end-to-end smoke tests.
  - Handle secrets management (Supabase, OpenAI) in CI and document required environment variables.
  - Implement AI-centric extras (personalised recommendations UI, admin insights dashboards) after core flows land.

Coordination rules:

- Agent 1 delivers the API adapter contract and OpenAPI draft before Agent 2 begins UI implementation.
- Agent 2 builds against mocks until backend endpoints are available; once ready, run integration tests against the live endpoints.
- Agent 3 enforces CI checks (lint, unit, integration, contract tests) on every PR and blocks merges on failures.
- All agents ensure Supabase SQL, server code, prompts, and edge functions remain version-controlled (no hidden logic in Supabase only).

## Open questions for user (needed before final spec)

- **Q1 (roles)** — ANSWERED: Minimal roles (`librarian`, `member`) via `profiles.role` + RLS.
- **Q2 (media metadata)** — ANSWERED: Adopt the generic `media` schema above (required: `media_type`, `title`, `creator`; optional fields enumerated).
- **Q3 (checkout behaviour)** — PARTIAL: `checked_out`, `checked_out_by`, `checked_out_at`, `due_date` confirmed. Need decision on reservations/holds and automatic due-date calculation.
- **Q4 (auth providers)** — OPEN: Decide whether to enable social OAuth (Google, GitHub) alongside email/password.
- **Q5 (AI suggest & admin assistant)** — ANSWERED: All AI-powered endpoints run server-side with streaming responses; must support free-form suggestions, optional personalised recommendations, and librarian analytics Q&A.
- **Q6 (checkout history & analytics)** — NEW: Specify requirements for historical circulation tracking (e.g., `media_loans` table capturing checkout/return events, late-return monitoring).

Please answer question 3 and question 4 next, then provide guidance on Q6.

## Recent changes & state

- Data model updated to generic `media` table with detailed indexing strategy.
- AI scope clarified: describe-your-need assistant, optional personalised recommendations, librarian analytics Q&A, all delivered via streaming responses.
- Backend handling layer decision still pending (Supabase Edge Functions vs FastAPI vs Nuxt). Documentation and tooling must stay flexible.
- a file was created at /docs/dev/plans-ci-cd-vercel-option.md as a potential set of plans for how to do CI/CD in this repo but it depends on prioritizing making a prototype quickly first

## Short checklist / next steps for Manager

- [ ] Get answers to the open questions above.
- [ ] Finalise `docs/dev/spec.md` with milestones, acceptance criteria, schema diagrams, and AI behaviour definitions (retrieval steps, streaming requirements).
- [ ] Create `/agents/agent{1,2,3}-responsibility.md` with step-by-step checklists.
- [ ] Create `/agents/agent{1,2,3}-context.md` starter files referencing the latest schema and AI requirements.
- [ ] Draft the API adapter interface and provide mock implementations (including streaming simulators) for Agent 2.

---

# Section 3 - Manager notes (LLMs can edit this section)

Use this section for manager-runner logs, brief findings, and short lived notes that help coordinate agents. Keep it compact and date each update.

- 2025-11-08: Q1 answered — minimal roles chosen (`librarian`, `member`). Implement minimal RBAC via `profiles.role` + RLS. TypeScript preference recorded earlier.
- 2025-11-08: Schema pivoted to generic `media` table with creator required, optional `book_format`/`language`, and due-date tracking. Index list documented.
- 2025-11-08: AI requirements clarified — describe-your-need assistant, optional personalised recommendations, librarian analytics Q&A. All LLM calls run server-side with streaming responses and code/prompts stored in repo.

