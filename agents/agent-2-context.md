# Agent 2 — Frontend & UX Context

## Current status
- Spec source of truth: `docs/dev/spec/spec-final.md` (locked 2025-11-10).
- Stack: Nuxt 4.2, Nuxt UI components, Tailwind CSS v4 (preflight + utilities), Pinia (if needed), VueUse.
- Adapter contract lives under `~/lib/api` (Agent 1 owns); UI consumes the shared Zod models.

## Responsibilities snapshot
- Build catalog, reservation, and circulation UI per spec §4–5 with MVP shortcuts (mock contact sheet, toast-driven notifications).
- Implement streaming AI chat panel shared by all roles (spec §4.6, §9.6).
- Ensure accessibility/keyboard support per spec §10 and streaming guidance.
- Maintain routeRules + middleware alignment for role gating, and embed the Supabase Auth UI at `/login` per spec §3.1/§4.4.

## Dependencies to watch
- Needs Agent 1’s API adapter & mock client (Step 3) before wiring data.
- Needs Agent 1’s catalog/account endpoints (Step 5) for live data; until then, rely on mocks.
- Coordinate with Agent 3 for lint/test scripts and deployment previews.
- `/api/logs/client` route (Agent 1 Step 9) must exist before wiring client error boundary telemetry.

## Open questions
- Reservation expiry messaging now fixed at 72h—UI copy must align.
- Default cover asset swap pending Supabase storage setup (see manager context).

## Communication
- Log progress and blockers after every PR in this file (include issue #, branch, status, next action).
- Tag Agent 1 if API contracts change; tag Agent 3 when new npm scripts or manual QA steps emerge.
