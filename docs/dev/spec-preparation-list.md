# Spec Preparation Checklist

This document tracks the outstanding decisions and definition work required before we can lock a complete, implementation-ready specification. Items are grouped by impact and ease of delivery so we can front-load the fastest, highest-value work.

---

## 1. Prototype-ready essentials (fast, low risk)

Decide and document the following to stand up a working prototype quickly while keeping future changes manageable:

- **Personas & access model** – Confirm guest, member, librarian-desk, librarian-admin roles and the minimal RBAC enforcement (Supabase `profiles.role` + RLS rules).
- **Catalog data model** – Finalize required columns, optional metadata stored in `jsonb`, initial Supabase schema and migrations.
- **Critical user flows** – Define MVP interactions: browse/search/paginate, media detail view, member reservations, librarian checkout/check-in, admin CRUD for media items.
- **Account management & auth UX** – Decide on signup/onboarding flow, SSO providers, profile editing, password reset, and error states for session expiry or logout.
- **SPA shell & design tokens** – Lock routing structure, layout zones, Tailwind v4 baseline (spacing, typography, breakpoints), basic accessibility patterns (ARIA landmarks, focus traps). Add a regression guard (lint/test) that fails if Tailwind is downgraded or its directives drift from v4 defaults.
- **Visual identity starter kit** – Pick primary/secondary color palette (with Tailwind tokens), typography scale, iconography guidelines, and dark-mode/contrast strategy so UI agents can iterate quickly.
- **Nuxt UI module adoption** – Decide how `@nuxt/ui`, `@nuxt/icon`, and `@nuxt/image` are composed with Tailwind utilities to accelerate UI delivery, and capture do/don't guidelines for agents.
- **Server API responsibilities** – Assign Nuxt server routes (or other Nitro handlers) for catalog CRUD, checkout/check-in, reservation queue updates, and collision handling, reaching for Supabase Edge Functions only when they offer a clear advantage.
- **Client data layer contract** – Specify API adapter surface, validation (zod), error handling conventions, and integration test expectations.
- **Seed data & CI basics** – Decide on demo data scripts, minimal GitHub Actions checks (lint, type-check, unit tests, preview deployment), and required env/config scaffolding.
- **Ops guardrails** – Branch protection rules, rollback note-taking, `.env.example` structure, Supabase project separation (dev/staging/prod) baseline.

## 2. Rapid polish upgrades (low risk, high payoff)

Prioritize these once the prototype is functional—they make the app feel complete without high engineering risk:

- **Member dashboard UX** – Define "My loans" / "My reservations" pages, empty-state copy, alerts for soon-due items.
- **Advanced catalog tooling** – Decide on filter facets (genre, availability, tags), sorting, and how they map to indexes.
- **Perceived performance & feedback** – Skeleton loaders, optimistic UI rules, undo/snackbar patterns, global error boundaries.
- **Accessibility audit plan** – Automate axe checks, manual keyboard testing strategy, screen-reader validation steps.
- **Component quality gates** – Determine Storybook usage, snapshot/visual regression scope, reusable component library rules.
- **CI enhancements** – Expand pipeline with Supabase staging connections, automated migrations, smoke E2E scripts (checkout scenario).
- **Telemetry & flags** – Pick logging structure (client/server), minimal analytics events, and configuration/feature flag approach.
- **Documentation touchpoints** – Establish setup scripts, edge-case checklist workflow, API contract draft (OpenAPI or similar) and how it stays in sync.
- **Style reference** – Document reusable layout patterns (cards vs list, modal sizing, form spacing), component density, and illustration/imagery rules for consistent handoff to UI implementation.
- **Module-driven UI enhancements** – Plan targeted uses of Nuxt UI/Icon/Image components for polish work (e.g., iconography, responsive media, prebuilt primitives) so agents default to them instead of rebuilding from scratch.

## 3. Later-stage / higher-effort enhancements (tackle after 1 & 2)

These add depth and differentiation but can be scheduled once the core experience and polish are locked in:

- **Extensible RBAC** – Plan full role/permission tables, admin UI for role assignments, and migration strategy from minimal roles.
- **Draft & moderation workflows** – Version history, approval queues, change diffs, soft-delete with restore windows.
- **Notification ecosystem** – Email templates, scheduling, opt-in preferences, failure fallbacks, integration with Nuxt server actions or (if superior) Supabase Edge Functions/third-party services.
- **AI & recommendations** – Define recommendation goals, Edge Function prompts/integration, and testing safeguards.
- **Deep observability** – Metrics dashboards, alert thresholds, structured logging vocabulary, distributed tracing (if hosting backend separately).
- **Bulk operations & reports** – CSV import/export with conflict resolution, reporting dashboards, scheduled data exports.
- **Performance governance** – Bundle-size budgets, automated thresholds, dependency hygiene, optional offline/queued operations.
- **Data retention & compliance** – Policies for archival, anonymization, user data export, and documentation of legal considerations.
- **API versioning & migration** – Outline approach for versioned endpoints, contract testing, and future Nuxt/SSR migration path without breaking the SPA.
--**Contact Form for Guest with Bot protection** - After other things are working well, adding a contact form that unauthenticated can use to send a contact is desired, but it should have a measure to filter out bot spam.  Intention: have a field "how did you hear about us" that is not visible to human users, so if it's filled out, it means it was a bot and can be ignored rather than sent to mailbox.  May or may not still return a submission success message in that case.
---

### How to use this list

1. Walk through Section 1 items in order, resolving open questions and recording decisions in `docs/dev/spec.md` and agent context files.
2. Feed Section 2 decisions into the spec as "Phase 1.5" / polish milestones to ensure they are queued right after the MVP is stable.
3. Log Section 3 items as stretch goals with clear success metrics so implementation agents can pick them up once the main spec is delivered.

Update this checklist as decisions are made or scope changes; once every item in Section 1 is defined, the spec is ready to finalize.
