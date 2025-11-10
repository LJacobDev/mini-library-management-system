# Section 1 - Context added by user. LLMs do not edit this section.

## Goal of this context file

This is a markdown file meant for an LLM to be able to refer to in order to both read important notes about context and goals and instructions, but also for the LLM to write updates about the context as it changes.

This is so that both the user and the LLMs involved can read this file in order to understand the goals, state, issues, challenges, assumptions, attempts, results and findings and adjustments to approaches, in ways that will help this project be very successful and a strong portfolio piece that has no anti-patterns present.

---

# Section 2 - Manager agent context and plan (LLMs can only edit this section with developer approval)

## Project summary

Mini Library Management System coordinated via multi-agent workflow. The application is now a Nuxt 4.2 full-stack project (Vue 3 Composition API on the client, Nitro server routes in-repo) backed by Supabase for Postgres + Auth. All backend logic (server routes, Supabase SQL, OpenAI prompts) must live in the repository.

High-level goals:

- Deliver librarian-facing workflows for creating, browsing, searching, reserving, checking out, and checking in media items (books, DVDs/videos, audio, other lendable resources) with pagination, filtering, and sorting.
- Support multi-copy inventory: every physical/digital copy is a distinct record tracked by UUID so availability and circulation are copy-scoped.
- Follow TDD / edge-case-first development, ship comprehensive automated tests (unit, integration, accessibility), and keep the API boundary explicit so backend implementations stay swappable if needed.
- Produce a polished, accessible, well-documented portfolio-grade demo with CI/CD, deployment pipeline (Vercel target), seeded demo data, and clear run instructions.
- After CRUD + reservations are solid, deliver the AI feature set (describe-your-need search, personalised recommendations, librarian analytics Q&A, all streaming responses). Build the architecture so these endpoints are easy to integrate even if time forces deferral.

## Manager responsibilities (high level)

- Finalise `docs/dev/spec.md` (milestones, acceptance criteria, CRUD → reservations → AI sequencing) and split work into three orthogonal responsibility tracks.
- Create `/agents/agent{1,2,3}-responsibility.md` and `/agents/agent{1,2,3}-context.md` aligned with the confirmed Nuxt + Supabase stack and schema.
- Maintain shared context files and coordinate overlap points, API contracts, migrations, prompt libraries, and AI UX expectations (streaming output, role-gated admin queries).
- Review and validate implementer agents' work against the spec (tests, lint, TDD checks) and ensure outputs remain portfolio-ready.
- Track deferred scaffolding (OpenAPI contract, unit-test HOWTO, `.env.example`, wireframes) so they are produced once the spec stabilises, avoiding churn.

## Current decisions (fixed)

- Framework: Nuxt 4.2 (Vue 3 Composition API + Nitro server routes) already initialised in repo.
- Backend data/auth: Supabase Postgres + Supabase Auth (mirror SQL/Edge logic in repo; no opaque hosted-only code).
- Language/tooling: TypeScript across Nuxt app; SQL for migrations; OpenAI integration via server routes.
- Hosting/CI: Vercel deployment (Nuxt) with GitHub Actions for lint/test/build before deploy.
- Development approach: TDD-first, small feature branches, PR reviews, GitHub CLI workflow.
- API contract: Frontend consumes a thin API adapter module hitting Nuxt server routes (which may call Supabase/OpenAI). Adapter returns typed POJOs and has mockable implementations for tests.
- Feature sequencing: 1) CRUD + inventory + check-in/out, 2) Reservations/holds, 3) AI endpoints (describe-your-need, personalised recs, admin Q&A) with streaming UX.
- TDD discipline: Edge-case checklist → tests → implementation. Tests at minimum per feature: unit (composables/utils), integration (adapter), component tests (Vitest + Vue Test Utils), accessibility (axe), plus smoke E2E (Playwright) once flows exist.
- Visual identity starter kit: (candidate) Primary `#1D3557`, Secondary `#E63946`, Accents `#457B9D` / `#A8DADC`, Neutral `#F1FAEE`; typography pairing `Inter` (UI) + `Cardo` (headings). Dark-mode optional but design tokens must support contrast-friendly swap.
- Styling baseline: Tailwind CSS v4 via `@nuxtjs/tailwindcss` with `tailwindcss/preflight` + `tailwindcss/utilities`. Add lint/test guardrails to detect dependency downgrades back to v3 scaffolding.
- Nuxt UI/Icon/Image modules: default to `@nuxt/ui` primitives, `@nuxt/icon`, and `@nuxt/image` for common UI patterns (navigation, lists, media, iconography) before rolling custom components.

## API boundary guidance (migration-friendly)

Keep all Supabase, OpenAI, and server route calls isolated inside a Nuxt server/client adapter (`/lib/api` namespace). This layer must:

- Export high-level methods (`listMedia`, `getMediaItem`, `createMediaItem`, `updateMediaItem`, `deleteMediaItem`, `reserveMediaItem`, `checkOutMediaItem`, `checkInMediaItem`, `searchMedia`, `recommendMedia`, `askCollectionQuestion`).
- Return plain objects (POJOs) and throw typed errors for failure modes.
- Include mocks (including streaming simulators) used by unit/integration tests and storybook-like previews.
- Avoid leaking Supabase clients or OpenAI objects beyond the adapter.

## Data model decisions (latest)

- Generic `media` table (enum `media_type`: `book`, `video`, `audio`, `other`). Each copy is its own UUID row. Optional fields include `genre`, `book_format`, `language`, `pages`, `duration_seconds`, `metadata` jsonb.
- Circulation columns on `media`: `checked_out`, `checked_out_by`, `checked_out_at`, `due_date` (NULL when not checked out). Automated trigger will sync with `media_loans`.
- `media_loans` table captures full history (checkout, due, return timestamps, optional note). `user_snapshot` stays nullable to avoid PII retention. Loans survive user/media deletion (`ON DELETE SET NULL`). Partial unique index enforces single active loan per copy.
- Reservation support will require additional schema (e.g., `media_reservations`) after CRUD lands. Record as TODO in spec.
- Retention/purge: add TODO to document policy (e.g., anonymise or purge loan data after X years while preserving aggregates). No policy text yet, but track the requirement.
- Migrations: store in `db/migrations`. Seeds (sample users/media/loans) live in `docs/data/schema.sql` (already created) and may be mirrored in Supabase seed scripts.

## AI / LLM feature requirements

- Describe-your-need assistant: server route performs Supabase full-text search → sends shortlisted items to OpenAI → returns JSON list (streamed tokens) with reasons.
- Personalised recommendations: leverage historical loans/reservations to build candidate list; optional if time constrained but architecture should permit a later drop-in.
- Librarian analytics Q&A: admin-only streaming endpoint that aggregates data (SQL) before calling OpenAI for narrative insights.
- Streaming responses mandatory for all text output endpoints; frontend must render incremental tokens gracefully with fallback copy.
- Non-negotiables: redact PII, enforce role checks, document rate limiting/cost controls, check prompts/prompt-library into repo.

## Proposed agent split (3 implementation agents)

- Agent 1 — Data & API layer + Supabase schema
  - Own migrations, seeds, RLS policies, triggers syncing media ↔ loans.
  - Implement Nuxt server routes for CRUD, checkout, check-in, reservations, AI, analytics.
  - Maintain `docs/api/openapi.yaml` once spec stabilises; keep API adapter + mocks current.
  - Provide retrieval helpers for AI endpoints (full-text search RPCs, history queries).

- Agent 2 — Frontend components & tests
  - Implement Nuxt pages/components/composables using Composition API.
  - Deliver accessibility-first UI (keyboard navigation, focus rings, ARIA) and responsive design.
  - Write unit/integration tests against adapter mocks; support streaming UI experiences.
  - Layer in reservations UI and AI interfaces once routes exist.

- Agent 3 — CI/CD, deployment, QA & extras
  - Build GitHub Actions workflows (lint/test/build/deploy) targeting Vercel; manage environment secrets (Supabase, OpenAI).
  - Curate seeded accounts/data for QA; maintain smoke tests.
  - Track deferred scaffolding (.env.example, wireframes, unit-test guide) and deliver once spec final.
  - Implement AI-centric extras (personalised rec dashboards, admin analytics visualisations) after core flows.

Coordination rules:

- Agent 1 ships the API adapter contract and OpenAPI draft immediately after spec lock; Agent 2 begins UI work against mocks meanwhile.
- Agent 2 validates against real routes once they land; Agent 3 ensures CI blocks merges on failing contract tests.
- All agents keep Supabase SQL, server code, prompts, and config stored in repo; no hidden Supabase edge functions.

### 2025-11-09 context updates

- Spec-kit exploration dropped: GitHub's `spec-kit` tool is not packaged for npm consumption and doesn't align with our review flow, so the spec will continue to be built manually inside the repo.
- Agent workflow agreement: each implementation agent will use the GitHub CLI to open an issue, implement the scoped change on a branch, and open a PR for manual review (with optional Codex reviews). Keep this loop in mind when drafting task hand-offs.
- Styling stack guidance: lock Tailwind CSS to v3 across docs and tooling for now (LLMs align better with v3 directives). Record any future v4 upgrade as an explicit migration task.
- Nuxt module priorities: plan to integrate `@nuxt/image` (starting with the built-in `ipx` provider, external CDN optional), `@nuxt/ui`, `@nuxt/icon`, `@nuxtjs/tailwindcss`, `@nuxtjs/supabase`, `@nuxt/content`, and `@nuxt/test-utils`. Fonts can leverage `@nuxt/font` (or Fontaine) once the UI palette is finalised.
- Media handling takeaway: Supabase storage is the source of truth; responsive delivery can rely on `ipx` for prototypes and add a CDN provider later if we need smarter transforms.
- Nuxt MCP note: the experimental `nuxt-mcp` package remains optional—observe from a sandbox first before considering adoption in the main repo.

## Open questions for user (needed before final spec)

- **Q1 (roles)** — ANSWERED: Minimal roles (`librarian`, `member`) via `profiles.role` + RLS.
- **Q2 (media metadata)** — ANSWERED: Adopt the generic `media` schema above (required: `media_type`, `title`, `creator`; optional fields enumerated).
- **Q3 (checkout & reservations)** — PARTIAL: Need detailed behaviour for holds/reservations (queueing, expiry, auto-convert to checkout) and whether due dates auto-calc (e.g., default 14 days, librarian override).
- **Q4 (auth providers)** — OPEN: Decide whether to enable social OAuth (Google, GitHub) alongside email/password.
- **Q5 (AI features)** — ANSWERED: All AI-powered endpoints run server-side with streaming responses; must support free-form suggestions, optional personalised recommendations, and librarian analytics Q&A. Architecture should make deferred delivery easy if time-constrained.
- **Q6 (checkout history & retention)** — PARTIAL: Confirm retention policy for loan history (e.g., anonymise after X years). Currently tracked as TODO; need explicit rule for compliance narrative.
- **Q7 (deferred scaffolding)** — OPEN: When spec is final, schedule creation of `.env.example`, `docs/api/openapi.yaml`, `docs/tests/test-plan.md`, `tests/unit/README.md`, and optional `docs/ux/wireframes.md` so they reflect the locked spec.
- **Q8 (color palette confirmation)** — OPEN: Approve proposed palette (`#1D3557`, `#E63946`, `#457B9D`, `#A8DADC`, `#F1FAEE`) and typography pairing (`Inter` + `Cardo`) or supply alternates.

## Recent changes & state

- Nuxt 4.2 selected as the framework; Supabase remains primary DB/auth; FastAPI exploration dropped.
- Data model updated to generic `media` + `media_loans` tables with sample seeds in `docs/data/schema.sql`.
- AI scope clarified with emphasis on streaming responses and admin analytics; architecture must make deferred implementation easy.
- CRUD first, reservations second, AI third — spec will reflect this sequence.
- `.env.example`, OpenAPI contract, test plan, unit-test README, and wireframes are intentionally deferred until spec lock to avoid churn (track in TODOs).

## Short checklist / next steps for Manager

- [ ] Answer open questions above (reservations detail, auth providers, retention policy, scaffolding schedule).
- [ ] Finalise `docs/dev/spec.md` with milestones, acceptance criteria, schema diagrams, reservation flow, and AI behaviour definitions (retrieval steps, streaming requirements).
- [ ] Create `/agents/agent{1,2,3}-responsibility.md` with step-by-step checklists.
- [ ] Create `/agents/agent{1,2,3}-context.md` starter files referencing the latest schema and AI requirements.
- [ ] Draft the API adapter interface and provide mock implementations (including streaming simulators) for Agent 2 once spec is locked.
- [ ] Capture styling patterns in a forthcoming `docs/dev/styling-playbook.md` once enough Tailwind v4 component examples exist; link it from the hybrid styling guide.
- [ ] Document preferred usage patterns for `@nuxt/ui`, `@nuxt/icon`, and `@nuxt/image` so implementation agents consistently leverage installed modules.

---

# Section 3 - Manager notes (LLMs can edit this section)

Use this section for manager-runner logs, brief findings, and short lived notes that help coordinate agents. Keep it compact and date each update.

- 2025-11-08: Q1 answered — minimal roles chosen (`librarian`, `member`). Implement minimal RBAC via `profiles.role` + RLS. TypeScript preference recorded earlier.
- 2025-11-08: Schema pivoted to generic `media` table with creator required, optional `book_format`/`language`, and due-date tracking. Index list documented.
- 2025-11-08: AI requirements clarified — describe-your-need assistant, optional personalised recommendations, librarian analytics Q&A. All LLM calls run server-side with streaming responses and code/prompts stored in repo.
- 2025-11-09: Dropped spec-kit, initially locked Tailwind v3 guidance, mapped priority Nuxt modules (image/ipx, ui/icon, tailwind, supabase, content, test-utils), and confirmed agents will follow the GH CLI issue→branch→PR workflow with optional CDN adoption deferred.
- 2025-11-10 (AM): Nuxt confirmed as final framework; Supabase remains backend; CRUD→reservations→AI sequencing logged; retention policy captured as TODO; deferred scaffolding list noted for post-spec lock.
- 2025-11-10 (PM): Tailwind CSS v4 confirmed as the production baseline (v3 discarded after repeated integration failures). Edge-case checklist and spec prep list updated accordingly. Outstanding: refresh agent prompts to reference v4 defaults and draft the styling playbook addendum once real-world examples accrue.

