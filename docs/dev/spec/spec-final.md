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
| Member | All guest abilities + reserve items, view personal loans, renew/return self-check items, request AI reading suggestions | `member` | Default role for newly created Supabase accounts. Cannot mutate catalog metadata.
| Librarian | All member abilities + perform manual checkout/check-in, override due dates, manage reservations, access AI suggestions for patrons during service interactions | `librarian` | Circulation staff operating on behalf of members. Requires elevated RLS permissions.
| Admin | Full CRUD on catalog, manage seed data, view audit logs, manage roles, request AI catalog insight reports | `admin` | Supervisors with authority over catalog and configuration.

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
- AI recommendation service: server route `/api/recommendations/suggest` (section 9.6) that calls OpenAI GPT-4o mini to supply member/librarian reading lists and admin-facing catalog insights, including rate limiting and schema-driven outputs.

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

### 4.6 AI Recommendation Experience (Shared Chat Panel)

- A single `AiChatPanel` component serves members, librarians, and admins. It opens from a persistent "Ask for recommendations" button that sits in the global header (desktop) or floating action button (mobile). Implementation agents only build this one UI surface.
- Panel layout: compact chat window with prompt textarea, optional interest chips, and streaming transcript using `UCard` bubbles. First chunk fades in with a skeleton placeholder and animated caret; finished responses show quick actions (`View title`, `Place hold`, `Copy insight`).
- Role awareness is handled in code, not layout: when the panel mounts it detects the signed-in role and injects the correct `mode` into the API call. The system message shown above the input tailors the guidance:
  - Members see copy like “Tell me what you’re in the mood for and I’ll suggest books you can borrow.”
  - Librarians read “Describe what the patron is looking for and I’ll surface titles to offer at the desk.”
  - Admins read “Ask about catalog coverage (e.g., ‘Do we need more STEM books?’). I’ll respond with inventory insights.”
- The streaming transcript is identical across roles. Only the content of tokens differs, derived from the API’s role-aware payload. Librarians receive availability badges next to suggestions; admins receive inline stat tags (counts/percentages) parsed from the structured response.
- Shared composable `useAiChat()` manages SSE consumption, abort handling, telemetry, and toast messaging for rate limits or upstream errors. The same component mounts on every allowed route, preventing duplication.
- Accessibility: chat history uses `aria-live="polite"`, focus returns to the input after messages stream, and a "Download conversation" button exports the session for all roles.
- Analytics hooks (`ai_chat_opened`, `ai_stream_completed`) log role, prompt length, and duration for later analysis.

## 5. User Journeys

1. **Guest discovery**: Load landing → browse catalog → view item detail.
2. **Member reservation**: Sign in → find checked-out book → click "Place hold" → confirm → receive toast + entry in `/account/reservations`.
3. **Member renewal/cancel**: Visit `/account/loans` → select item → click "Renew" → backend validates no conflicts → new due date reflected; from `/account/reservations` use "Cancel" to drop a pending hold.
4. **Desk checkout correction**: Librarian opens `/desk/checkout` → search member → scan/select item → confirm due date → receipt toast and optional printable slip → if error discovered, open active loans, choose "Undo checkout" or "Adjust due date" and optionally add note.
5. **Admin catalog update**: Admin visits `/admin/media/:id/edit` → adjusts metadata → saves → change reflected in catalog. Cancel button safely exits without persisting changes.
6. **AI-assisted discovery**: Member, librarian, or admin opens the shared "Ask for recommendations" chat panel → enters a prompt → watches streamed suggestions populate in the same chat window → uses the inline action (place hold, copy suggestion, view insight) appropriate to their role. On success the reservation or insight confirmation toast appears.

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
| POST | `/api/recommendations/suggest` | Member/Librarian/Admin | Accepts a role-aware prompt payload (`mode = 'member' | 'librarian' | 'admin'`) plus optional context; streams incremental tokens back to the client while delivering reader-facing suggestions or managerial catalog insights depending on mode. |

Every route implements:
- Input validation with Zod.
- Error translation to HTTP status + `error.code` (`VALIDATION_ERROR`, `PERMISSION_DENIED`, etc.).
- Logging of action + correlation ID.
- Integration tests covering happy path + at least one edge case each.

## 7. Client Data Layer

### 7.1 Thin API adapter

- A minimal adapter lives in `~/lib/api/client.ts`, exporting an `ApiClient` interface and `createApiClient(fetchImpl?: FetchLike)` factory. Default instance delegates directly to Nuxt server routes using `fetch`/`useFetch`.
- Adapter surface mirrors the server API (section 6) one-for-one: `listCatalog`, `getCatalogItem`, `createMedia`, `updateMedia`, `deleteMedia`, `checkoutLoan`, `checkinLoan`, `createReservation`, `cancelReservation`, `getMyLoans`, `getMyReservations`, and `suggestRecommendations`.
- `suggestRecommendations(input: RecommendationPrompt)` posts the caller’s declared interests, optional `mediaId`, and explicit `mode` (`member`, `librarian`, or `admin`). It returns a discriminated union `RecommendationResponse` that contains `mediaRecommendations` (ranked media IDs + rationale) for patron-facing modes or `catalogInsights` (topic, summary, suggested action) for admin mode. The adapter exposes this as a `StreamingResult<RecommendationResponse>` so UI layers can paint incremental text tokens while still receiving the final structured payload once the stream closes. Circuit breaker logic prevents retry storms on upstream failures and emits a `streamAborted` flag when the flow is terminated early.
- Each method unwraps the shared response envelope, applies schema validation, and returns typed POJOs without additional transformation. Mutations opt out of retries; GET endpoints use a shared retry helper (max two attempts, jittered backoff, abort support).
- A companion `createMockApiClient(overrides)` factory in `~/lib/api/mocks.ts` powers Vitest/component tests, preloading happy-path fixtures but allowing per-test overrides.

### 7.2 Shared types & validation

- Canonical domain types and Zod schemas reside in `~/lib/api/types.ts` and are imported by both server routes and the adapter via `z.infer`. Core models: `MediaSummary`, `MediaDetail`, `LoanRecord`, `ReservationRecord`, `RecommendationPrompt`, `RecommendationResult`, and `PaginatedResponse<T>`.
- Recommendation schema requires `interests: string[]`, optional `mediaId`, optional `tone` (`'shortlist' | 'discovery'`), and mandatory `mode` (`'member' | 'librarian' | 'admin'`).
- `RecommendationResponse` is a discriminated union on `mode`:
  - `mode: 'member' | 'librarian'` → `{ mode; mediaRecommendations: RecommendationResult[] }` where each `RecommendationResult` includes `mediaId`, `score`, `reason`, and `callId` for traceability.
  - `mode: 'admin'` → `{ mode; catalogInsights: CatalogInsight[] }` where `CatalogInsight` captures `topic`, `summary`, `supportingData` (e.g., counts, genres), and optional `suggestedActions`.
- Shared helpers validate discriminators so UI can branch safely without runtime type checks.
- Response envelope is standardised as `ApiResponse<T> = { success: true; data: T } | { success: false; error: { code: 'VALIDATION_ERROR' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'CONFLICT' | 'SERVER_ERROR'; message: string; details?: unknown } }`.
- `~/lib/api/errors.ts` exports `ApiError` plus `assertSuccess(response)`; adapter methods call `assertSuccess` after parsing. Error codes map directly to UI handling (toasts, redirects, retry prompts).
- Streaming endpoints expose helper types declared in `~/lib/api/streaming.ts`:
  - `StreamingChunk` — `{ type: 'text' | 'json'; content: string; at: number }` representing decoded SSE tokens.
  - `StreamingResult<T>` — `{ stream: AsyncIterable<StreamingChunk>; collect(): Promise<T>; abort(reason?: Error): void; onComplete?: (meta: StreamingMeta) => void }` so consumers can iterate over tokens or await the resolved payload.
  - `StreamingMeta` — `{ requestId: string; durationMs: number; usage?: TokenUsage }` capturing OpenAI usage metrics when available.

### 7.3 Testing & composable usage

- Feature composables (`useCatalog`, `useLoans`, etc.) receive the adapter via dependency injection (provide/inject token) to keep tests deterministic.
- Unit tests consume `createMockApiClient`, swapping in success/error scenarios (including streaming chunk sequences) without touching network code. Integration tests hit real Nuxt server routes and assert their payloads validate against the shared schemas while asserting stream ordering and graceful abort handling.
- Retry logic and error translation are centralised in `~/lib/api/retry.ts` and `~/lib/api/errors.ts`, ensuring UI layers simply respond to typed outcomes. Recommendation calls skip automatic retries if the upstream returns `429` or `rate_limit_exceeded` to avoid breaching OpenAI policies; UI surfaces a friendly retry timer instead.
- Cache policy leverages Nuxt `useAsyncData` with `stale-while-revalidate` defaults; adapter methods stay synchronous wrappers so composables can opt into advanced caching later without contract changes.

## 8. UI & Design Tokens

- **Palette (light mode first)**: Primary `#1B4F72` (deep blue reminiscent of civic signage), Secondary `#2E8B57` (balanced evergreen), Accent `#F4A261` (warm highlight for CTAs and alerts). Neutral stack anchors on `#F7F9FC` backgrounds, `#1F2933` body text, and `#64748B` for subdued copy. Success/Warning/Error colours map to Tailwind-adjacent values (`#2ECC71`, `#F59E0B`, `#E74C3C`) to keep overrides simple. Documented as placeholders we can revise quickly once the live UI takes shape.
- **Typography scale**: Inter typography with display text at `clamp(2.25rem, 3vw + 1rem, 3rem)` for hero moments, heading tiers at Tailwind `text-4xl`, `text-3xl`, `text-2xl` (1.1 line-height), body copy at `text-base` (1rem, 1.6 line-height), and supporting text at `text-sm` (0.875rem, 1.5 line-height). `font-medium` anchors labels, `font-semibold` highlights primary actions.
- **Spacing rhythm**: Tailwind 4px base unit; section padding `py-12` desktop / `py-8` mobile, and card spacing anchored to 16/24/32px (multiples of 4/6/8). All values captured as guidelines so agents can fine-tune once screens are visible.
- **Breakpoints**: Mobile-first tiers tuned for responsive civic sites—`sm` ≥480px (large phones), `md` ≥768px (tablets landscape), `lg` ≥1024px (laptops), `xl` ≥1280px (wider desktops). Align Tailwind config to these thresholds and keep `2xl` in reserve for future dashboard density needs.
- **Iconography**: `@nuxt/icon` renders icons via the Iconify catalog (Heroicons outline by default). We'll expose aliases and size defaults through `app.config.ts` (`icon.size = '20px'`, `icon.class = 'text-primary-500'`) and keep the module in `css` mode with `cssLayer: 'base'` so Tailwind utilities style icons predictably. Collections stay scoped (e.g., install `@iconify-json/heroicons-outline`) and can be swapped by editing `nuxt.config.ts > icon.serverBundle.collections`, making the icon system fast to adjust without code churn.
- **Image handling**: `@nuxt/image` drives all cover art. We define a `cover` preset in `nuxt.config.ts` with `sizes="100vw sm:60vw md:400px lg:360px"`, `modifiers: { fit: 'cover', format: 'webp', quality: 75 }`, and `placeholder: [32, 18, 70, 4]` for a blur-up experience. Media cards call `<NuxtImg preset="cover" loading="lazy" densities="x1 x2" />`, producing a mobile-friendly default that narrows on larger screens while staying adjustable from one config stanza. Supabase public storage domains are whitelisted via `image.domains` so switching storage buckets or resizing rules is a one-line change.
- **Tailwind ↔ Nuxt UI contract**: Tailwind v4 remains the single source of truth for design tokens using the `@theme` directive inside `app/assets/css/main.css`. Tokens defined there (palette, fonts, spacing, breakpoints) generate Tailwind utilities and CSS variables simultaneously. Nuxt UI reads those variables via `app.config.ts` (e.g., `ui.colors.primary: 'var(--color-primary-500)'`), keeping both systems aligned without duplication. Any bespoke components keep using Tailwind utilities, while Nuxt UI components inherit the same tokens through the shared variables. This arrangement is easy to evolve—update the token once in CSS, and both layers stay synced.
- **Nuxt UI component defaults (Nuxt 4.2 verified)**: Lean on Nuxt UI v4.1 primitives that ship with Nuxt 4.2. The librarian/admin app shell uses the dashboard suite (`DashboardGroup`, `DashboardNavbar`, `DashboardSidebar`, `DashboardSidebarToggle`, `DashboardToolbar`, `USlideover`) for responsive navigation. Public/member views combine `Header`, `NavigationMenu`, `Main`, `Footer`, and `Container`/`PageSection` blocks. Surface content with `UCard`, `UTabs`, `PageHeader`, `PageSection`, `Empty`, and `UTable` + `Pagination`. Modals and confirmations standardize on `UModal`, `UDialog`, and toast utilities bundled in `UApp`. Forms use `UForm`, `UFormField`, `UInput`, `USelect`, `USelectMenu`, `UCheckbox`, `URadioGroup`, `UTextarea`, `USwitch`, and `UButton`, with Tailwind utilities for layout tweaks. This catalogue is copied directly from the Nuxt UI docs, ensuring agents don’t reach for pro-only or deprecated APIs.

These tokens bias toward a welcoming, well-lit municipal aesthetic and are intentionally easy to revisit after the MVP lands.

## 9. Server API Responsibilities & Contracts

### 9.1 Execution context

- Nitro server routes own all MVP workflows: catalog CRUD, circulation (checkout, renew, return, overrides), reservation queue, and member self-service endpoints.
- Librarian/admin mutations execute with the Supabase service key on the server, guarded by explicit role checks; member operations pass through the signed-in user session so RLS still enforces ownership.
- Supabase Edge Functions remain on the roadmap for long-running or scheduled jobs (e.g., overdue reminder batches, nightly reservation sweeps) and are not required for MVP delivery.

### 9.2 Catalog management

- `GET /api/catalog` & `GET /api/catalog/:id` expose search/detail views for guests and authenticated users. Responses include pagination metadata, live availability, and queue summaries. Responses may set short-lived cache headers (`max-age=30`, `stale-while-revalidate=60`) plus `etag` to aid client revalidation.
- `POST /api/catalog`, `PATCH /api/catalog/:id`, and `DELETE /api/catalog/:id` are restricted to librarians/admins. Writes validate against shared Zod schemas, emit audit log events (`media_created`, `media_updated`, `media_archived`), and execute inside a Supabase transaction when side effects (storage sync, audit insert) are present.
- Creation enforces uniqueness on `(title, creator)` (optionally `external_id`) and returns `409_conflict` when a duplicate is attempted. `PATCH`/`DELETE` require an `If-Match` header carrying the last `updated_at` value; conflicts surface as `409_precondition_failed`.

### 9.3 Circulation (loans)

- `POST /api/loans` creates loan records. Payload includes a client-generated `loanRequestId` for idempotency, optional librarian `memberId`, and optional override `dueAt`. On success the response returns the canonical `LoanRecord` with computed `dueAt` and `loanNumber`.
- `PATCH /api/loans/:id/renew` and `PATCH /api/loans/:id/return` support renewals and returns. Members may renew their own loans unless a reservation is queued; librarians can pass `force: true` (with justification) when policy allows overrides. Returns automatically reconcile the reservation queue, locking the next reservation inside the same transaction so hand-off data is returned in the payload (`handoff.reservationId`, `handoff.memberId`).
- `POST /api/loans/:id/override` lets librarians/admins set custom due dates, mark items lost/damaged, or waive fines. All circulation mutations require request IDs stored in `loan_events` for deduplicated retries and emit audit codes (`loan_created`, `loan_renewed`, `loan_returned`, `loan_override_*`).
- Business-rule conflicts bubble up as typed errors: `member_limit_reached`, `already_checked_out`, `reservation_waiting`, `policy_violation`. Lock contention returns `423_locked` prompting exponential backoff retries in the adapter.

### 9.4 Reservation queue

- `POST /api/reservations` queues a hold. Mutex logic prevents duplicate holds per member/media and enforces the active-reservation limit. Reservations track `position`, `status`, and a fixed `expiresAt` window of 72 hours before the hold auto-advances. Request IDs (`reservationRequestId`) de-duplicate submissions.
- `PATCH /api/reservations/:id/claim` transitions a reservation to `ready_for_pickup` (or triggers auto-checkout if policy later enables it). `DELETE /api/reservations/:id` cancels a hold and rebalances queue positions inside a serializable transaction. Librarian action `POST /api/reservations/:id/advance` handles no-shows or manual promotions.
- Queue updates use `SELECT ... FOR UPDATE` to guarantee a consistent ordering; if the queue changed mid-operation the route returns `409_conflict` with `conflictCode: 'queue_modified'` and a recommended retry delay. Return handlers share a utility that locks the next reservation and sets its pickup window in the same transaction as the loan return.

### 9.5 Idempotency & failure envelopes

- Client-provided request identifiers (`loanRequestId`, `renewalRequestId`, `returnRequestId`, `overrideRequestId`, `reservationRequestId`, `cancelRequestId`, `advanceRequestId`) are persisted per entity; repeated submissions return the original response payload with `idempotentReplay: true`.
- All mutations wrap Supabase calls in transactions so catalog mutations, loan state changes, audit logging, and queue adjustments succeed or fail together. Transient database errors trigger safe retries (up to two attempts with jitter) before surfacing `retryable_error` to the adapter.
- Error taxonomy aligns with the shared envelope: `validation_failed`, `unauthenticated`, `forbidden`, `not_found`, `conflict` (with rich `conflictCode`), `precondition_failed`, `locked`, and `server_error`. Adapters map these codes to UI behaviours (inline messaging, retry prompts, escalation modals).

### 9.6 AI recommendations

- `POST /api/recommendations/suggest` is handled in a Nitro server route that validates the caller payload, enriches it with catalog metadata (top genres, availability snapshots, gaps per format), and calls OpenAI’s `responses.create` endpoint with the GPT-4o mini model using `stream: true`. Prompt template lives in `server/services/recommendations/templates.ts` and is versioned to keep changes reviewable.
- OpenAI key is read from server runtime config (`runtimeConfig.openai.apiKey`) and never exposed client-side. Requests include `X-Client-Request-Id` (UUID) plus `user` identifier (`profileId`) for audit and adhere to OpenAI usage policies (max 10 requests/min per member/librarian and 5/min per admin via in-memory token bucket).
- Nitro streams SSE chunks back to the client, annotating each token with its role (`analysis`, `suggestion`, `insight`) before reducing them into the discriminated union from section 7.2. Patron modes filter out missing/archived media before returning; admin mode emits aggregated catalog signals (e.g., genres under-represented, high-demand items lacking copies) without exposing raw PII.
- Failure modes bubble up as `validation_failed`, `upstream_unavailable`, or `rate_limited`. Rate limits return `retryAfter` (seconds) so UI can display appropriate messaging. All errors are logged with correlation IDs for later observability (wired to Sentry/Logflare) and annotated with the supplied client request ID.

## 10. Accessibility & UX Guardrails

- All interactive components have accessible labels and keyboard focus management.
- Page landmarks (`header`, `main`, `nav`, `footer`) enforced.
- Toasts announced via `aria-live` regions.
- Streaming recommendation text renders inside an `aria-live="polite"` region with visually progressive tokens and a skeleton fallback until the first chunk arrives.
- Forms provide inline validation messages and summary near submit button.
- Submit buttons stay disabled until required fields validate; errors surface both inline (field-level helper text/icons) and in a summary banner/toast for screen reader awareness. Each form includes explicit `Cancel`/`Back` actions that respect keyboard navigation.
- Error states covered: search returning no results (with recovery guidance), reservation conflicts (already on hold), permission denied prompts, network/server failures with retry, and offline fallbacks with cached data where feasible.
- High-contrast checks run via automated tests (axe-core) once pipeline configured (post-MVP but placeholders added).

## 11. Testing & Quality Strategy

- **Edge-case-first**: For each feature, enumerate edge cases using `docs/dev/edge-case-checklist.md` before implementation.
- **TDD Workflow**:
  1. Write unit/integration test failing on new requirement.
  2. Implement minimal code to pass.
  3. Refactor with safety (lint/type check).
- **Test stack**: `vitest` for unit/integration, `@nuxt/test-utils` for component + server route tests. Future E2E via Playwright once MVP stable.
- **CI gates**: `pnpm lint`, `pnpm typecheck`, `pnpm test`, optional `pnpm test:e2e -- --reporter=line` (skippable initially).
- **Coverage goals**: 80% lines on core server routes and composables.
- **Recommendation endpoint**: unit tests stub OpenAI via MSW and ensure prompt payloads, rate-limiting response, streaming chunk ordering, patron recommendation filtering, and admin insight synthesis behave. CI includes a daily canary job hitting OpenAI’s testing model with a synthetic prompt (feature-flagged to run only when `OPENAI_API_KEY` is present in non-fork contexts).

## 12. Deployment & Operations

- Environments: `local`, `preview` (per PR on Vercel), `production` (Vercel).
- Supabase project: single `mlms-demo` instance shared across local, preview, and production, with service role keys stored in Vercel environment variables and `.env.local` for developers.
- `.env.example` lists required keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NUXT_APP_SITE_URL`, etc.).
- Branch strategy: feature branches → PR → `vue3-spa-spec-building` (integration) → `main` (release). Protected branches require review + green CI.
- Rollback: Vercel deploy history + Supabase migration tracking. Manual rollback instructions recorded in `docs/dev/plans-ci-cd-vercel-nuxt.md`.

## 13. Seed Data & Bootstrapping

### 13.1 Canonical schema & migrations

- `docs/data/schema.sql` remains the single source of truth. Supabase migrations are generated with `supabase db diff --linked --file migrations/<timestamp>_<slug>.sql` and committed alongside change notes.
- Every migration is replayed locally via `pnpm db:migrate` (wrapper around `supabase db push`) before opening a PR. CI runs the same command against a disposable database to guarantee drift-free deploys.

### 13.2 Seed dataset

- Authoritative seed lives in `scripts/db/seed.ts` (TypeScript) and is compiled/run via `tsx`. It imports shared Zod schemas to guarantee data parity.
- Initial records:
  - **Users**: one admin (`admin@example.com`), one librarian desk user (`librarian@example.com`), two members (`member.alice@example.com`, `member.bob@example.com`). Passwords follow Supabase’s seeded auth convention; plaintext stored only in documentation for local onboarding.
  - **Profiles**: mirror `user_role` enum, include display names, avatar placeholder URLs, and preferences (timezone, notification opt-in).
  - **Media**: minimum 12 items across formats (`book`, `audiobook`, `ebook`, `video`). Each entry carries metadata (`authors`, `subjects`, `published_at`, `tags`, `description`, `cover_url` placeholder referencing Supabase storage `public/covers/default.webp`).
  - **Loans**: showcase at least one active loan, one overdue loan, and one returned loan for demo dashboards.
  - **Reservations**: populate a short queue (two members waiting on the same title) to exercise reservation UI states.
- Seed script upserts by stable identifiers (`external_id`, email) so re-running remains idempotent.

### 13.3 Commands & local setup

- `pnpm db:reset` (to be added) wipes the local Supabase instance, runs migrations, executes the TypeScript seed, and prints seeded user credentials. Under the hood:
  1. `supabase db reset --linked`
  2. `pnpm db:migrate`
  3. `pnpm db:seed`
- `pnpm db:seed` runs `tsx scripts/db/seed.ts` targeting the Supabase connection string from `.env.local` (`SUPABASE_SERVICE_ROLE_KEY` required).
- `.env.example` enumerates all required variables: Supabase URL/anon/service keys, Vercel site URL, Nuxt public base URL, image domain allowlist, seed asset path (`NUXT_APP_DEFAULT_COVER_URL`), plus `OPENAI_API_KEY` and `OPENAI_MODEL` (default `gpt-4o-mini`). The file is kept in sync whenever a new variable is introduced.

### 13.4 CI integration

- GitHub Actions workflow `ci.yml` (to be authored) executes: `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. A follow-up job provisions a temporary Postgres using Supabase Docker image, runs `pnpm db:migrate`, and executes `pnpm db:seed` to verify migrations plus seed remain green in headless mode.
- Preview deployments on Vercel depend on a successful CI run and pull Supabase credentials from Vercel project secrets. Seeded assets (default cover) are uploaded to the dev Supabase storage bucket and referenced by environment variable so previews render real imagery.
- Once Supabase bucket access is available, replace the placeholder cover in seeds with the uploaded default asset to maintain parity between local and hosted environments.

## 14. Operational Guardrails

This project is a demo and only needs lightweight operational guidance.

### 14.1 Source control

- Develop on short‑lived branches and raise PRs into `main`.
- Keep `main` protected: require the CI workflow (lint → typecheck → test → build) plus one approval before merge. Direct pushes stay disabled.

### 14.2 Hosting & environment

- A single Supabase project `mlms-demo` backs every environment (local dev, preview, and the live demo). Provision one storage bucket for covers and reuse seeded data.
- Vercel hosts the Nuxt app; the same project handles preview deploys and production. `.env.example` lists the required variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NUXT_APP_SITE_URL`, `NUXT_APP_DEFAULT_COVER_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`). Copy these into Vercel project settings and GitHub Actions environment secrets.

### 14.3 Deployment & uptime

- Any merge to `main` triggers Vercel to rebuild and redeploy automatically. If a deploy needs to be retried, click “Redeploy” from the Vercel dashboard.
- No additional release cadence or staging promotion is required—keep the demo running through the technical assessment window.

### 14.4 Secrets & rollback

- Rotate Supabase or OpenAI keys manually by updating Vercel env vars and `.env.example`; rerun CI to confirm everything still builds.
- If a problematic change lands, revert the commit in GitHub or roll back to a previous Vercel deployment. For data resets, re-run `pnpm db:seed` against `mlms-demo` or restore the seed snapshot manually.

### 14.6 Observability & audits

- Supabase logs (auth/storage/db) are forwarded to Logflare (built-in) with 14-day retention; production errors are mirrored to Sentry (Nuxt module to be configured during implementation) using DSNs stored in environment secrets.
- GitHub Actions artifacts retain CI logs for 30 days to aid debugging.
- Access control changes (role promotions, service role rotations) are recorded in `docs/dev/ops-changelog.md` so implementation agents can verify environment parity.

## 15. Future-facing Hooks (documented, not MVP)

- Notification infrastructure (email reminders) tracked in backlog.
- Contact form with honeypot anti-spam targeted post-MVP.

---

## 16. Considerations Backlog (from `spec-preparation-list-essential`)

### Essential decisions to secure before coding

1. [x] **Personas & minimal RBAC contract** – Confirm the four roles (guest, member, librarian, admin); map to Supabase `profiles.role`; define baseline RLS allow/deny rules.
2. [x] **Catalog data contract** – Finalise required columns, `jsonb` metadata conventions, and ship the first Supabase migration; lock validation rules for title/creator, availability state, pagination defaults.
3. [x] **Critical user journeys** – Document the exact screens and transitions for browse → detail → reserve/checkout → return; capture edge cases (empty results, overdue, reservation conflicts).
4. [x] **Auth & account lifecycle** – Decide on signup/onboarding, supported SSO providers, password reset, email verification flows, and error handling for expired sessions; note Supabase UI vs custom Nuxt pages.
5. [x] **Nuxt shell, routing, and middleware** – Choose SSR/SSG/CSR per route, define layout zones, and specify route middleware for role gating/loading states; clarify hydration rules and Supabase client availability on server/client.
6. [x] **Design tokens baseline** – Choose the primary/secondary palette, typography scale, spacing/breakpoints, and record whether Tailwind config or Nuxt UI theme is the source of truth.
7. [x] **Nuxt UI/Icon/Image usage plan** – Documented component catalogue, icon defaults (aliases + 20px base size via `app.config.ts`), and the mobile-first `cover` preset for `@nuxt/image` (`sizes="100vw sm:60vw md:400px lg:360px"`, lazy loading, blur placeholder). Tailwind tokens stay the shared contract so swapping components or resizing rules is a single-config edit.
8.1. [x] **Schema.sql quality pass** – Hardened migrations (`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`, new `user_role`/`media_format` enums), tightened `users` constraints, dropped redundant media checkout columns, added timestamp triggers, and enabled RLS with policy stubs so downstream contracts stay in sync.
8.2. [x] **Client data layer contract** – Locked the thin adapter surface (mirrors server routes), shared Zod/TypeScript models, response envelope, retry strategy, and testing/mocking guidance in section 7.
9. [x] **Server API responsibilities** – Locked in Nuxt server ownership for catalog, circulation, and reservations (section 9), documented idempotency tokens, conflict codes, and when to escalate to future Supabase Edge Functions.
10. [x] **Seed data & baseline CI** – Section 13 captures the seed dataset, commands (`pnpm db:reset`, `pnpm db:seed`), `.env.example` contract, and GitHub Actions gates (lint, typecheck, test, build, migration + seed smoke). Bucket placeholder swap remains queued once assets exist.
11. [x] **Operational guardrails** – Section 14 codifies branch protections, Supabase environment separation, secret rotation cadence, deployment flow, rollback playbook, and observability notes.

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
- **AI & recommendations (advanced)** – Personalised embeddings, long-term preference learning, evaluation harness.
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
- **Dark mode theme follow-up** – Define and implement a complementary dark palette once the light-mode MVP is validated.
- **Catalog contract refinements** – Revisit uniqueness rules for special editions/multiple copies, add admin un-archive tooling, tune catalog cache windows, and ensure adapter-generated `If-Match` headers remain ergonomic once real traffic patterns emerge.
- **Circulation policy refinements** – Reassess default loan/renewal windows per media format, document librarian override audit requirements, design notification hooks (due soon, overdue), and evaluate fee/ledger handling for lost/damaged items once the MVP workflows stabilize.
- **Reservation policy refinements** – Finalise expiry duration and reminder cadence, decide on auto-checkout behaviour for digital media, and plan the queue auto-advance executor (cron/Edge Function) for no-shows post-MVP.
