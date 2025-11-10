# Spec Preparation Checklist

This document captures every outstanding decision needed to ship an implementation-ready specification. Items are ordered from fastest, highest-impact wins through to slower, high-effort initiatives so we can stack momentum efficiently.

---

## 1. High-impact quick wins (do first)

Resolve these definitions immediately; they unblock core development with minimal lift:

- **Personas & minimal RBAC** – Lock guest, member, desk librarian, and admin roles plus Supabase `profiles.role` conventions and baseline RLS rules.
- **Catalog data contract** – Finalize required columns, `jsonb` metadata conventions, and the initial Supabase migration set.
- **Critical user journeys** – Map MVP flows (browse/search/paginate, media detail, member reservation, librarian checkout/check-in, admin CRUD) and note edge cases.
- **Auth & account lifecycle** – Nail down signup/onboarding, SSO providers, password reset, email verification callbacks, session expiry handling, and error surfaces inside Nuxt.
- **Nuxt shell & routing** – Define SSR/SSG/CSR usage per route, layout zones, route middleware for role gating, and hydration guardrails.
- **Design tokens baseline** – Choose primary/secondary palette, typography scale, Tailwind spacing/breakpoints, and clarify whether Tailwind config or Nuxt UI theme is the single source of truth.
- **Client data layer contract** – Specify API adapter surface, validation (zod), error handling expectations, and minimal integration test coverage.
- **Edge Function responsibilities** – Assign Supabase Edge Functions for catalog CRUD, circulation actions, and reservation queue collision handling.
- **Seed data & CI starter** – Commit demo data scripts, lint/type/unit GitHub Actions checks, preview deployment gate, and `.env.example` expectations.
- **Operational guardrails** – Document branch protections, rollback checklist, Supabase project separation (dev/stage/prod), runtime config keys, and how secrets stay in sync across environments.

## 2. Fast polish boosters (after Section 1 is green)

Tackle these once the prototype runs end-to-end; they level up product quality quickly without heavy engineering cost:

- **Member dashboard UX** – Design "My loans" / "My reservations" pages, proactive notices, and empty states.
- **Advanced catalog tooling** – Prioritize filter facets (genre, availability, tags), sorting logic, and supporting indexes.
- **Perceived performance patterns** – Define skeleton loaders, optimistic updates, undo/snackbar behaviors, and global error boundaries.
- **Accessibility & QA plan** – Automate axe checks, set manual keyboard/screen-reader protocols, and document acceptance criteria.
- **Component quality gates** – Decide on Storybook usage, snapshot/visual regression scope, and reusability rules.
- **CI/preview enhancements** – Wire Supabase staging credentials, automated migrations, and a smoke E2E checkout script.
- **Telemetry & feature flags** – Outline logging approach (client/server), analytics events, and basic configuration/flag tooling.
- **Documentation touchpoints** – Produce setup scripts, integrate the edge-case checklist workflow, and draft an API contract (OpenAPI or similar) with sync strategy.
- **Style reference guide** – Catalog layout patterns (cards vs. list, modal sizing, form spacing), component density expectations, and imagery guidelines for implementation agents.

## 3. Medium-horizon upgrades (schedule after polish)

These deepen the experience and resilience; plan for them once Sections 1 and 2 are locked:

- **Extensible RBAC** – Design full role/permission tables, admin UI for role assignments, and migration path from the minimal model.
- **Draft & moderation workflows** – Introduce version history, approval queues, diff viewing, and soft-delete with restore windows.
- **Notification ecosystem** – Define email templates, scheduling, opt-in preferences, and failure fallbacks with Supabase or third-party services.
- **AI & recommendations** – Clarify recommendation goals, Edge Function prompt strategy, evaluation loops, and guardrails.
- **Deep observability** – Plan metrics dashboards, alert thresholds, structured logging, and distributed tracing (if backend hosting warrants).
- **Bulk operations & reporting** – Scope CSV import/export, conflict resolution UX, dashboards, and scheduled exports.
- **Performance governance** – Set bundle-size budgets, automated threshold enforcement, dependency hygiene checks, and (optional) offline queues.
- **Data retention & compliance** – Document archival/anonymisation policies, user data export tooling, and legal considerations baked into schema and storage rules.
- **API versioning & migration posture** – Outline versioned endpoint strategy, contract testing approach, and future Nuxt SSR migration paths.

## 4. Long-range differentiators (tackle when core is mature)

Invest here once the platform is stable and the earlier categories are complete:

- **Nuxt caching & freshness strategy** – Define `routeRules`, ISR/CSR cache windows, and Supabase revalidation hooks to balance freshness vs. load.
- **Supabase RLS test harness** – Build automated proof-of-concept tests that exercise RLS policies via Nuxt server routes.
- **Operational resilience** – Extend rollback playbook, add incident response drills, and codify observability dashboards.
- **Contact form with bot protection** – Ship guest-access contact form featuring hidden honeypot fields (e.g., unseen "How did you hear about us"), with optional success messaging even when blocked submissions are dropped.
- **Extended telemetry & analytics** – Layer in richer event taxonomy, BI exports, and governance for analytics consumers.
- **Future Nuxt deployment scenarios** – Evaluate hybrid rendering, edge deployments, and internationalisation/locale expansion strategies.

---

### How to use this list

1. Complete Section 1 sequentially, logging decisions in `docs/dev/spec.md` and relevant agent context files.
2. Queue Section 2 items as the immediate follow-up milestone once MVP flows clear manual QA.
3. Slot Section 3 initiatives into roadmap planning with success metrics before engineering begins.
4. Treat Section 4 as strategic stretch goals; revisit after initial launch metrics confirm stability.

Update the checklist whenever scope shifts—if any Section 1 item remains unresolved, the spec is not yet ready to freeze.
