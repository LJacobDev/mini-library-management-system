# Spec Preparation Essentials

Need to sprint a working prototype? This condensed list calls out only the decisions you **must** lock before implementation and the ones you can safely defer. Build the prototype by completing the "Essential" section top-to-bottom; everything in "Defer Until After Prototype" can wait until the MVP is live and stable.

---

## Essential decisions to secure before coding

Complete these items in order. Each unlocks critical aspects of the prototype, and skipping any of them will create rework or block core flows.

1. **Personas & minimal RBAC contract**  
   - Confirm the four roles (guest, member, desk librarian, admin).  
   - Map roles to Supabase `profiles.role` values and define baseline RLS allow/deny rules.
2. **Catalog data contract**  
   - Finalize required columns, `jsonb` metadata conventions, and ship the first Supabase migration.  
   - Lock validation rules for title/creator, availability state, and pagination defaults.
3. **Critical user journeys**  
   - Document the exact screens and transitions for browse → detail → reserve/checkout → return.  
   - Capture edge cases (empty results, overdue, reservation conflicts).
4. **Auth & account lifecycle**  
   - Decide on signup/onboarding, supported SSO providers, password reset, email verification flows, and error handling for expired sessions.  
   - Note which pieces are handled by Supabase UI vs. custom Nuxt pages.
5. **Nuxt shell, routing, and middleware**  
   - Choose SSR/SSG/CSR per route, define layout zones, and specify route middleware for role gating and loading states.  
   - Clarify hydration rules and Supabase client availability on server/client.
6. **Design tokens baseline**  
   - Choose the primary/secondary palette, typography scale, spacing/breakpoints, and record whether Tailwind config or Nuxt UI theme is the source of truth.
7. **Nuxt UI/Icon/Image usage plan**  
   - Decide how `@nuxt/ui` primitives, `@nuxt/icon`, and `@nuxt/image` integrate with Tailwind utilities for layouts, cards, navigation, and media.  
   - Capture preferred components/patterns so agents default to these modules instead of rebuilding fundamentals.
8. **Client data layer contract**  
   - List Nuxt server API endpoints (and note any optional Supabase Edge Functions only if they outperform the Nuxt route), response shapes, and zod validation schemas.  
   - Document error handling, retry/backoff, and integration test expectations.
9. **Server API responsibilities**  
   - Assign ownership for catalog CRUD, checkout/check-in, and reservation queue collision handling within Nuxt server routes, escalating to Supabase Edge Functions only when they deliver a clear advantage.  
   - Capture idempotency expectations and failure modes.
10. **Seed data & baseline CI**  
   - Produce seed scripts for demo media, users, and loans.  
   - Define lint, type-check, unit test, and preview deploy gates plus `.env.example` requirements.
11. **Operational guardrails**  
    - Document branch protections, rollback checklist, Supabase project separation (dev/stage/prod), runtime config keys, and environment-secret sync process.

When all ten are resolved, the essential spec is complete and implementation can start without major unknowns.

---

## Defer until after the prototype is working

These decisions add polish, resilience, or differentiation. Capture ideas in backlog but don’t block the MVP:

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

Revisit this backlog immediately after the MVP clears acceptance so the project keeps its momentum without sacrificing quality.
