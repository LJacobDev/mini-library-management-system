# Mini Library Management System — Specification v1

_Last updated: 2025-11-10_

## 1. Product Overview

- **Mission**: Deliver a Nuxt 4.2-based library management system that demonstrates multi-agent collaboration, balances rapid delivery with high quality, and satisfies the assessment's core and bonus goals.
- **Primary Outcomes**:
  - Librarians can curate the catalog, manage circulation, and resolve conflicts quickly.
  - Members can discover items, place holds, and track their loans with clear feedback.
  - The system is spec-driven, TDD-friendly, and ready for Supabase-backed deployments (preview + production).
- **Non-goals (for v1)**: Bulk imports/exports, advanced analytics, full automation of overdue reminders, deep AI integrations (beyond placeholder hooks), localisation, and multi-tenant support.

## 2. Personas & Access Model

| Persona | Capabilities | Supabase `profiles.role` | Notes |
| --- | --- | --- | --- |
| Guest | Browse catalog (read-only), view basic metadata | `guest` | Unauthenticated visitor. No row in `profiles`; treated as synthetic client-only role for RLS checks.
| Member | All guest abilities + reserve items, view personal loans, renew/return self-check items | `member` | Default role for newly created Supabase accounts. Cannot mutate catalog metadata.
| Librarian | All member abilities + perform manual checkout/check-in, override due dates, manage reservations | `librarian` | Circulation staff operating on behalf of members. Requires elevated RLS permissions.
| Admin | Full CRUD on catalog, manage seed data, view audit logs, manage roles | `admin` | Supervisors with authority over catalog and configuration.

### Access control & session flow

- Roles: `guest` (session-only), `member`, `librarian`, `admin`.
- `profiles.role` defaults to `member`; promotion to `librarian` or `admin` happens through admin tooling and inherits lower-role abilities.
- Guests are not persisted; unauthenticated visits run in a client-only guest context with read-only Nuxt server policies and get prompted to sign in for reservations/checkouts.
- Supabase RLS policies enforce:
  - Catalog reads are public; writes require `librarian` or `admin`.
  - Members can mutate only their own reservations and active loans.
  - Librarians may act on behalf of members for circulation flows, and actions record `processed_by` for audit.
  - Admin-only endpoints guarded by middleware requiring `admin` role.

## 3. System Architecture

- Rendering strategy:
  - Public discovery routes (`/`, `/catalog`, `/catalog/:id`) keep SSR enabled for SEO/first paint; data rehydrates client-side via Supabase hooks, accepting minor flicker.
  - Authenticated dashboards (`/account/*`, `/desk/*`, `/admin/*`) set `ssr: false` in `routeRules` to avoid session hydration mismatches and keep implementation simple.
- Styling: Tailwind CSS v4 (`tailwindcss/preflight`, `tailwindcss/utilities`) + Nuxt UI component primitives. Guard rails in tests ensure directives remain v4.
- Component strategy: Compose Nuxt UI components (cards, tables, forms) styled with Tailwind tokens. Shared UI atoms stored in `app/components/ui/*`.
- Navigation & guards: Global middleware hydrates the Supabase session on every navigation, then role-specific middleware (`auth`, `librarian`, `admin`) gate protected routes with loading indicators and friendly redirects to `/login`. Server-rendered guards were considered for stronger SSR protection but deferred for the MVP to keep complexity low.

### 3.1 Routing & middleware contract

Canonical paths stay aligned with the initial backlog to reduce cognitive load.

| Route | SSR mode | Middleware | Notes |
| --- | --- | --- | --- |
| `/` | `ssr: true` | `session` (global) | Landing hero + featured media hydrate via client Supabase.
| `/catalog` | `ssr: true` | `session` | Query params drive search: `q`, `mediaType`, `availability`, `genre`, `page`, `pageSize` (capped at 50). All params stored in URL for copy/paste.
| `/catalog/:id` | `ssr: true` | `session` | Uses dynamic segment for media slug/ID; `?tab=` optional for future reviews/queue.
| `/login` | `ssr: true` | none | Slim auth layout, no protected data.
| `/account/loans` | `ssr: false` | `session` + `auth` | Client-only dashboard to avoid hydration mismatches; fetches via composables with stale-while-revalidate.
| `/account/reservations` | `ssr: false` | `session` + `auth` | Shares dashboard layout; `?filter=active|history` reserved.
| `/desk/checkout` | `ssr: false` | `session` + `librarian` | Desk tools are CSR to keep scanning workflows snappy.
| `/admin/media` | `ssr: false` | `session` + `admin` | Admin list with `?status`, `?owner` filters.
| `/admin/media/new` | `ssr: false` | `session` + `admin` | Form-only route using same admin layout.
| `/admin/media/:id/edit` | `ssr: false` | `session` + `admin` | Edit screen; preserves `?from=` query for return navigation.

- Layouts: Single shared shell (header + role-aware sidebar) with responsive drawer below `lg`. `/login` and future auth-only flows use a slim layout (centered card, no sidebar).
- Middleware flow: `session` middleware always runs first to hydrate Supabase client state; it gracefully handles expired sessions (clears cache + redirects to `/login?redirect=…`). Role middleware (`auth`, `librarian`, `admin`) read from the hydrated profile and redirect with toast messaging when access is denied.
- Supabase availability: The client plugin exposes `useSupabaseClient` globally; middleware and layouts rely on this composable. Server routes import `~/server/utils/supabaseServiceClient` to ensure service-role key usage stays isolated to the server.
- `nuxt.config.ts` encodes these SSR choices via `routeRules` (`'/account/**': { ssr: false }`, `'/admin/**': { ssr: false }`, desk routes similarly), keeping public pages SSR by default. Any new protected routes must declare their middleware + CSR mode explicitly in the spec before implementation.

### 3.2 Supabase integration & backend (Nuxt Server Routes + Supabase)

- Data source: Supabase Postgres with schema in [`docs/data/schema.sql`](../../data/schema.sql). Migrations managed via Supabase CLI and tracked in repo.
- Nuxt server routes handle business logic (e.g., checkout). Edge Functions considered if latency-sensitive or requiring elevated policies.
- Runtime config keys (Supabase URL, anon key, service role key for server routes) stored in `.env` + typed in `nuxt.config.ts`.
- API error handling: Standardised JSON envelopes `{ success, data, error }` with `error.code` aligned to client handling contract.
- Supabase client usage:
  - A Nuxt plugin creates a client-side Supabase instance using the public anon key (stored in `runtimeConfig.public.supabaseAnonKey`) for auth and low-privilege reads.
  - Protected mutations go through Nuxt server routes that instantiate Supabase with the service-role key from private runtime config, so secrets never ship to the browser.
  - Development mode can bypass email verification via environment flag; production keeps verification enforced. Decisions documented in section 4.4.

### 3.3 Data Contracts

- `media` table: canonical catalog entries with metadata, availability flags, and JSONB `metadata` for extensibility. Each physical/digital copy lives in its own row to keep the demonstration build simple, with a note that production systems may prefer separate title vs. copy tables.
- `media_loans` table: immutable loan history with unique constraint ensuring one active loan per item.
- `users` table: optional mirror of Supabase auth identities for joins; future-proofed for deletions via `deleted_at`.
- **Validation checkpoint**: Before locking schema-derived decisions, run the SQL in Supabase (or a local Postgres) to confirm types, enums, and indexes create successfully and adjust the spec with any findings.
- Index strategy already defined (GIN for metadata, case-insensitive search) to support search endpoints.

### 3.4 Integrations & Tooling

- Supabase Auth (email/password + optional OAuth providers to be finalised).
- Vercel deployment target (preview builds per PR, production from `main`).
- GitHub Actions CI pipeline: lint, type-check, unit tests, optional Supabase migration dry-run, Vercel preview trigger.
- Optional AI feature placeholder: server route `/api/recommendations/suggest` returning stubbed recommendations to be replaced later.

## 4. Core Feature Requirements

### 4.1 Catalog Management (Admin)

- Create/Edit/Delete media items with validation:
  - Required: `title`, `creator`, `media_type`.
  - Conditional: `isbn` required for books, `duration_seconds` for audio/video.
  - Metadata stored in JSONB with whitelisted keys (e.g., `tags`, `condition`).
- Bulk status changes limited to future enhancement; v1 handles one item at a time.
- Activity logging: each mutation records `updated_at` and responsible user ID.

### 4.2 Catalog Browse & Detail (All users)

- Landing page highlights featured media (top borrowed items, curated list from metadata tag `staff-pick`).
- Catalog view supports search (title, creator, ISBN) and filters (media type, availability, genre) with pagination (default 20/page).
- Detail page shows full metadata, availability, loan history snippet (admins), reservation status, related items (basic same-genre list).
- Empty states guide action (e.g., "No results" with suggestions).
- Members can cancel pending reservations from detail or dashboard views; edit of existing holds is deferred to a post-MVP enhancement.

### 4.3 Circulation (Members & Librarians)

- Members:
  - Request reservation/hold when item is unavailable.
  - View current loans with due dates, renew if allowed (once, before due date, no existing holds).
  - Cancel pending reservations directly from the reservations list with confirmation toast.
  - Return items (self-check-in) for digital/locker workflows; updates loan record and catalog flag.
- Desk librarians:
  - Checkout flow: scan/search item, select member, set due date (default 14 days, override allowed), update `media` and `media_loans`.
  - Check-in flow: mark item returned, optionally add note, ability to mark 'lost or damaged', auto-clear reservations queue.
  - Active loans table exposes actions to adjust due dates or undo a mistaken checkout (reverses the `media_loans` record and frees the copy); optional note field captures the reason when provided.
  - Overdue handling: mark as returned late, optionally waive fines (fines tracked in future release).
- Admin oversight: view reservation queues, manually reorder or cancel holds, resolve conflicts.

### 4.4 Account Management & Auth

- Sign in/up flow embeds Supabase Auth UI in `/login`, themed to match tokens. We accept Supabase’s prebuilt screens and avoid rebuilding flows until necessary.
- MVP collects display name, email, and notification preferences only. Future enhancement note: optional address fields for physical mailing can be added post-MVP.
- Auth method: email/password only at launch. UI copy and configuration leave space for adding Google OAuth later without structural changes.
- Email verification required before access; in development environment we bypass verification to speed testing. Production login keeps the Auth UI displayed with an inline banner prompting users to check email for the verification link.
- Password reset relies on Supabase’s hosted flow: users request reset, receive email with redirect back to our login view, where a custom state allows entering new password + confirmation.
- Session management uses Supabase defaults for expiration/refresh. If a session expires mid-action, we first try to present a modal login prompt layered over the current page to resume work quickly but fall back to redirecting to login screen if implementation hits obstacles.
- Error handling: provide clear messaging for invalid credentials, locked accounts, and rate limiting. Member-facing copy stays generic (“Check your email and password”); librarian/admin views include diagnostic detail. Add backlog reminder to polish messaging tone later.
- Offline/failed auth requests: show retry guidance and link to a “Contact us” page that currently responds with a mock acknowledgement (real backend coming post-MVP).
- Profile editing limited to display name and notification preferences (stored in Supabase `user_metadata`).  Add backlog item after MVP that user can add tags of what their interests are to help AI recommend media to them.

### 4.5 Observability Hooks (MVP level)

- Console logging replaced with structured logger (e.g., `consola`) capturing event, user ID, correlation ID.
- Client-side error boundary with fallback UI and logging to server route `/api/logs/client` (stores in Supabase table or Vercel Log Drains later).

## 5. User Journeys

1. **Guest discovery**: Load landing → browse catalog → view item detail.
2. **Member reservation**: Sign in → find checked-out book → click "Place hold" → confirm → receive toast + entry in `/account/reservations`.
3. **Member renewal/cancel**: Visit `/account/loans` → select item → click "Renew" → backend validates no conflicts → new due date reflected; from `/account/reservations` use "Cancel" to drop a pending hold.
4. **Desk checkout correction**: Librarian opens `/desk/checkout` → search member → scan/select item → confirm due date → receipt toast and optional printable slip → if error discovered, open active loans, choose "Undo checkout" or "Adjust due date" and optionally add note.
5. **Admin catalog update**: Admin visits `/admin/media/:id/edit` → adjusts metadata → saves → change reflected in catalog. Cancel button safely exits without persisting changes.

Edge cases for each journey tracked via `docs/dev/edge-case-checklist.md`; tests must cover empty results, session expiry mid-action, conflicting holds, and permission denials.

## 6. API Surface (initial)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/catalog` | Public | List media items with query params `q`, `mediaType`, `availability`, `page`, `pageSize` (capped at 50). |
| GET | `/api/catalog/:id` | Public | Retrieve media detail, including reservation queue length and active loan status. |
| POST | `/api/catalog` | Admin | Create media item. Request body validated via Zod schema `MediaCreateInput`. |
| PATCH | `/api/catalog/:id` | Admin | Update media item fields with partial validation. |
| DELETE | `/api/catalog/:id` | Admin | Soft-delete (sets `metadata.archived = true`); hard delete deferred. |
| POST | `/api/loans/checkout` | Librarian desk/Admin | Begin loan, body includes `mediaId`, `memberId`, `dueDate`. |
| POST | `/api/loans/checkin` | Librarian desk/Admin/Member (self-return) | Mark loan returned, handle notes and reservation reconciliation. |
| POST | `/api/reservations` | Member | Place hold; server enforces queue order and max active holds per member (default 5). |
| DELETE | `/api/reservations/:id` | Member/Librarian Desk | Cancel hold. |
| GET | `/api/me/loans` | Authenticated | Fetch current member loans, optionally include history (paginated). |
| GET | `/api/me/reservations` | Authenticated | Fetch reservations. |
| POST | `/api/recommendations/suggest` | Authenticated | Placeholder AI endpoint returning curated list (real model integration later). |

Every route implements:
- Input validation with Zod.
- Error translation to HTTP status + `error.code` (`VALIDATION_ERROR`, `PERMISSION_DENIED`, etc.).
- Logging of action + correlation ID.
- Integration tests covering happy path + at least one edge case each.

## 7. Client Data Layer

- Use Nuxt server-side composables (`useAsyncData`, `useFetch`) wrapped in custom hooks (e.g., `useCatalog`, `useLoans`).
- Centralise API interactions in `~/lib/api` with typed response models.
- Global error boundary shows toast and optionally revalidates data.
- Implement retry/backoff for idempotent GET requests (max 2 retries) and fail-fast for mutations.
- Cache policy: rely on Nuxt `useAsyncData` caching with `stale-while-revalidate` semantics where appropriate.

## 8. UI & Design Tokens

- Palette: Primary `#1F3A8A` (blue-900), Secondary `#10B981` (emerald-500), Neutral base `#111827` / `#F9FAFB`, Accent `#F59E0B` for cautions.
- Typography: Inter font, sizes tokenised (`text-sm`, `text-base`, `text-lg`, `text-xl`). Line-heights matching Tailwind defaults.
- Spacing scale: Tailwind default 4px base; container max width 1200px.
- Breakpoints: Tailwind defaults (`sm`, `md`, `lg`, `xl`); nav collapses to drawer below `lg`.
- Iconography: `@nuxt/icon` with Heroicons outline by default.
- Image handling: `@nuxt/image` for responsive cover art with placeholders.
- Dark mode: Deferred (documented in backlog) but color tokens chosen to allow later inversion.

## 9. Accessibility & UX Guardrails

- All interactive components have accessible labels and keyboard focus management.
- Page landmarks (`header`, `main`, `nav`, `footer`) enforced.
- Toasts announced via `aria-live` regions.
- Forms provide inline validation messages and summary near submit button.
- Submit buttons stay disabled until required fields validate; errors surface both inline (field-level helper text/icons) and in a summary banner/toast for screen reader awareness. Each form includes explicit `Cancel`/`Back` actions that respect keyboard navigation.
- Error states covered: search returning no results (with recovery guidance), reservation conflicts (already on hold), permission denied prompts, network/server failures with retry, and offline fallbacks with cached data where feasible.
- High-contrast checks run via automated tests (axe-core) once pipeline configured (post-MVP but placeholders added).

## 10. Testing & Quality Strategy

- **Edge-case-first**: For each feature, enumerate edge cases using `docs/dev/edge-case-checklist.md` before implementation.
- **TDD Workflow**:
  1. Write unit/integration test failing on new requirement.
  2. Implement minimal code to pass.
  3. Refactor with safety (lint/type check).
- **Test stack**: `vitest` for unit/integration, `@nuxt/test-utils` for component + server route tests. Future E2E via Playwright once MVP stable.
- **CI gates**: `npm run lint`, `npm run typecheck`, `npm run test`, optional `npm run test:e2e -- --reporter=line` (skippable initially).
- **Coverage goals**: 80% lines on core server routes and composables.

## 11. Deployment & Operations

- Environments: `local`, `preview` (per PR on Vercel), `production` (Vercel).
- Supabase projects: separate dev/stage/prod with service role keys stored in Vercel environment variables.
- `.env.example` lists required keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NUXT_APP_SITE_URL`, etc.).
- Branch strategy: feature branches → PR → `vue3-spa-spec-building` (integration) → `main` (release). Protected branches require review + green CI.
- Rollback: Vercel deploy history + Supabase migration tracking. Manual rollback instructions recorded in `docs/dev/plans-ci-cd-vercel-nuxt.md`.

## 12. Seed Data & Bootstrapping

- Supabase SQL file (`docs/data/schema.sql`) is canonical; migrations generated from it and committed.
- Seed script (to be implemented) inserts demo users (member, librarian, admin) and media items.
- On first boot, run `npm run db:reset` (script to push schema + seed). Implementation agent to create this script when database tooling added.

## 13. Future-facing Hooks (documented, not MVP)

- AI recommendation endpoint stub to be replaced with OpenAI/Supabase AI call.
- Notification infrastructure (email reminders) tracked in backlog.
- Contact form with honeypot anti-spam targeted post-MVP.

---

## 14. Considerations Backlog (from `spec-preparation-list-essential`)

### Essential decisions to secure before coding

1. [x] **Personas & minimal RBAC contract** – Confirm the four roles (guest, member, librarian, admin); map to Supabase `profiles.role`; define baseline RLS allow/deny rules.
2. [x] **Catalog data contract** – Finalise required columns, `jsonb` metadata conventions, and ship the first Supabase migration; lock validation rules for title/creator, availability state, pagination defaults.
3. [x] **Critical user journeys** – Document the exact screens and transitions for browse → detail → reserve/checkout → return; capture edge cases (empty results, overdue, reservation conflicts).
4. [x] **Auth & account lifecycle** – Decide on signup/onboarding, supported SSO providers, password reset, email verification flows, and error handling for expired sessions; note Supabase UI vs custom Nuxt pages.
5. [x] **Nuxt shell, routing, and middleware** – Choose SSR/SSG/CSR per route, define layout zones, and specify route middleware for role gating/loading states; clarify hydration rules and Supabase client availability on server/client.
6. [ ] **Design tokens baseline** – Choose the primary/secondary palette, typography scale, spacing/breakpoints, and record whether Tailwind config or Nuxt UI theme is the source of truth.
7. [ ] **Nuxt UI/Icon/Image usage plan** – Decide how `@nuxt/ui` primitives, `@nuxt/icon`, and `@nuxt/image` integrate with Tailwind utilities for layouts, cards, navigation, and media; capture preferred components/patterns so agents default to these modules instead of rebuilding fundamentals.
8. [ ] **Client data layer contract** – List Nuxt server API endpoints (and note any optional Supabase Edge Functions only if they outperform the Nuxt route), response shapes, and Zod validation schemas; document error handling, retry/backoff, and integration test expectations.
9. [ ] **Server API responsibilities** – Assign ownership for catalog CRUD, checkout/check-in, and reservation queue collision handling within Nuxt server routes, escalating to Supabase Edge Functions only when they deliver a clear advantage; capture idempotency expectations and failure modes.
10. [ ] **Seed data & baseline CI** – Produce seed scripts for demo media, users, and loans; define lint, type-check, unit test, and preview deploy gates plus `.env.example` requirements.
11. [ ] **Operational guardrails** – Document branch protections, rollback checklist, Supabase project separation (dev/stage/prod), runtime config keys, and environment-secret sync process.

### Defer until after the prototype is working

- **Member dashboard UX polish** – Empty states, proactive reminders, and alert styling.
- **Advanced catalog tooling** – Extra filters and sort combinations beyond the MVP.
- **Perceived performance patterns** – Skeleton loaders, optimistic updates, undo/snackbar conventions.
- **Accessibility & QA program** – Automated axe coverage and formal testing protocol (perform lightweight manual checks meanwhile).
- **Component quality gates** – Storybook, visual regression, and reuse governance.
- **CI/preview enhancements** – Supabase staging connections, automated migrations on previews, smoke E2E checkout.
- **Telemetry & feature flags** – Detailed analytics taxonomy, runtime flag infrastructure.
- **Documentation touchpoints** – Full setup scripts, edge-case checklist workflow automation, OpenAPI spec integration.
- **Style reference guide** – Layout catalog, imagery and density guidelines.
- **Extended RBAC** – Admin UI for permissions, migration strategy for complex roles.
- **Draft/moderation workflows** – Version history, approval queues, soft-delete restores.
- **Notification ecosystem** – Email templates, scheduling, opt-in preferences, failure fallbacks.
- **AI & recommendations** – Recommendation goals, prompt strategy, evaluation harness.
- **Deep observability** – Metrics dashboards, alert thresholds, distributed tracing.
- **Bulk operations & reporting** – CSV import/export, dashboards, scheduled exports.
- **Performance governance** – Bundle budgets, dependency hygiene, optional offline queues.
- **Data retention & compliance** – Long-term archival/anonymisation policies and user data exports.
- **API versioning & migration posture** – Versioned endpoints, contract testing, future SSR migration.
- **Nuxt caching & freshness strategy** – `routeRules`, ISR/CSR cache windows, revalidation hooks.
- **Supabase RLS test harness** – Automated cross-layer security tests.
- **Operational resilience drills** – Incident playbooks, rollback rehearsal, observability dashboards.
- **Contact form with bot protection** – Honeypot anti-bot logic and messaging.
- **Extended telemetry & analytics** – BI exports and governance.
- **Future Nuxt deployment scenarios** – Hybrid rendering, edge deployment, localisation expansion.
