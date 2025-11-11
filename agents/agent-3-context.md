# Agent 3 — DevOps, QA, and Documentation Context

## Current status
- CI/CD planned via GitHub Actions + Vercel auto-deploy (spec-final §13–14).
- `.env.example`, OpenAPI, test plan, and wireframes already staged; ensure they stay in sync as work lands.
- Demo app targets single Supabase project `mlms-demo`; manual rollback acceptable.

## Responsibilities snapshot
- Own GitHub workflows, branch protections, npm scripts, and Supabase/Vercel config glue.
- Maintain automated testing (unit, integration, smoke) and manual QA checklists.
- Curate developer documentation (`README`, onboarding, ops runbooks) and release notes.
- Ensure command references across spec/docs stay on npm syntax and surface CI/preview status badges.

## Dependencies to watch
- Needs Agent 1’s migrations and seed scripts to finalize CI DB steps.
- Needs Agent 2’s routes/components to wire Playwright smoke tests (optional).
- Coordinates with both agents on environment variable changes and logging/monitoring hooks.
- Requires Agent 1 to expose `/api/logs/client` + telemetry helpers before locking logging plugins.

## Communication
- Update this file after each PR (issue, branch, status, next steps).
- Post reminders when secrets or CI matrices change; tag other agents in their context files if action required.
