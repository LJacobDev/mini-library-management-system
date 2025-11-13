# Agent 1 Context Log

Use this file to keep everyone aligned on backend progress. Update after every issue/PR with terse bullet points.

## Project snapshot

- **Stack:** Nuxt 4.2 (Nitro server routes) + Supabase Postgres/Auth + OpenAI streaming (GPT-4o mini).
- **Spec source:** `docs/dev/spec/spec-final.md` (locked 2025-11-10). Backend-focused sections: §3 (architecture), §4.1–4.6 (features), §6 (API surface), §9 (server responsibilities), §13 (data bootstrap).
- **Key contracts:** `docs/api/openapi.yaml`, `~/lib/api/types.ts`, `~/lib/api/client.ts`, `docs/data/schema.sql`.
- **Collab touchpoints:**
  - Agent 2 consumes OpenAPI + adapter outputs and needs seeded/demo data.
  - Agent 3 relies on migrations/scripts/env naming for CI.

## Current status (initial)

- Baseline OpenAPI, schema.sql, and test scaffolds exist but require confirmation against spec-final.
- `.env.example` includes Supabase + OpenAI placeholders; double-check before handing off to Agent 3.
- No Supabase migrations or seed scripts committed yet.

## Next planned issues

1. Convert schema.sql into timestamped Supabase migrations.
2. Align `.env.example` with runtime needs and document secrets.
3. Publish API adapter interfaces + mocks for Agent 2.

## Notes & reminders

- Demo shortcuts acceptable if they improve product creation in less time - suggest them if any are available, but do not choose them unless explicitly approved by dev user.
- Reservation queue logic depends on loan return flows—coordinate changes carefully.
- Keep OpenAPI and TypeScript definitions in lockstep; failing to do so blocks the other agents.
- Admin catalog mutations must respect `If-Match` concurrency checks and emit audit logs so UI copy stays accurate.
- Persist idempotency request IDs in `loan_events` and expose `/api/logs/client` once circulation flows land; Agent 3 depends on both for observability.

Append dated updates below as work progresses.
