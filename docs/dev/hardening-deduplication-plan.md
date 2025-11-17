# Hardening Deduplication Plan

> **Purpose**: Reference playbook for refactoring duplicated sanitizing, validation, and hardening helpers into shared utilities without regressing existing Nuxt 4 + Supabase flows. Use this document while executing the rework so every step stays auditable and easy to roll back.

## Current duplication snapshot

| Theme | Description | Current touchpoints |
| --- | --- | --- |
| Control-char + whitespace cleanup | Parallel `stripControlCharacters` + `replace(/\s+/g, ' ')` + `trim` helpers with slightly different length caps. | `server/api/catalog.get.ts`, `server/api/admin/media.get.ts`, `server/api/loans*.ts`, `server/api/ai/recommend.post.ts`, `app/composables/useCatalogData.ts`, `app/composables/useAdminMediaData.ts`, desk/admin components. |
| Search term sanitizing & LIKE escaping | Multiple `stripUnsafeSearchCharacters`, `escapeLikeTerm`, `quoteFilterValue` implementations. | Catalog GET, Admin media GET, Loans GET, AI recommend. |
| Pagination guards | `parsePositiveInteger`, manual clamp logic, and client `clampPage` variants. | Same endpoints above + UI composables. |
| UUID/email/identifier validation | Regex helpers copy-pasted per route. | Loans checkout, renew, return, admin media patch, future member APIs. |
| Freeform text limits | `sanitizeNote`, `sanitizeText`, `sanitizeIdentifier` repeating patterns. | Loans checkout/return/renew, desk UI. |
| AI prompt hygiene | Prompt redaction, keyword sanitizing, wildcard builders partially overlapping existing helpers. | `/api/ai/recommend.post.ts`. |

## Refactor steps (run sequentially)

1. **Snapshot + branch**
   - Record current state in `agents/agent-fast-start-context.md` (note this plan and checkpoint hash).
   - Create a feature branch or bookmark commit for rollback.

2. **Shared text utilities**
   - Add `utils/sanitizeText.ts` (isomorphic) exposing `stripControlChars`, `normalizeWhitespace`, `sanitizeFreeform(value, { maxLength, allowEmpty })`.
   - Replace usages in `server/api/loans.post.ts` first; verify checkout flow, commit.
   - Continue migrating return/renew + catalog/admin composables in separate commits.

3. **Validators module**
   - Create `server/utils/validators.ts` with `assertUuid`, `assertEmail`, `sanitizeIdentifier`.
   - Update loans endpoints + admin media patch (one file per commit) and rerun desk/CRUD smoke checks.

4. **Search helper extraction**
   - Introduce `utils/searchFilters.ts` (sanitize search term, escape LIKE, quote filter values, build OR filters).
   - Refactor `catalog.get.ts`, confirm search still works, commit; replicate for admin media and loans list.

5. **Pagination helper**
   - Build `utils/pagination.ts` covering parse/clamp/min/max.
   - Apply to catalog API, admin media API, loans API, then mirror on client composables (`app/utils/pagination.ts`).

6. **AI prompt helper module**
   - Move prompt wrapping, keyword cleanup, redaction, and wildcard builders into `server/utils/aiPrompts.ts`.
   - Update `/api/ai/recommend` plus any dependent tests/manual scripts; verify streaming still works in `/debug`.

7. **UI sanitizers**
   - Export client-safe helpers (re-export from `utils/sanitizeText.ts` or create `app/utils/sanitizeClient.ts`).
   - Update circulation/admin forms to rely on shared helpers; re-test manual desk workflow.

8. **Documentation + guardrails**
   - Update `docs/dev/llm-training-cutoff-updates.md`, `docs/manual-testing-guidelines-2.md`, and context logs describing new shared utilities and how to use them.
   - Note any follow-up TODOs (e.g., reservation endpoints) to adopt the helpers when built.

9. **Validation pass**
   - Run `npm run lint` (or `npx nuxi typecheck` + targeted manual QA).
   - Smoke-test: catalog search, admin media CRUD, loan checkout/return, AI concierge SSE, `/debug` request builder.
   - Once green, create a final summary commit referencing this plan.

## Rollback precautions

- After each step, commit immediately so a single `git revert <sha>` restores prior behavior.
- Keep the feature branch until QA approves; fallback is to reset to the snapshot commit noted earlier.
- When touching both server + client, gate deployments with manual `/debug` verification before merging.

## Tracking & sign-off checklist

- [x] Shared sanitizeText util created and consumed by at least one API + one composable.
- [x] Validators module live (UUID/email/identifier) and adopted by loans/admin routes.
- [x] Search helpers powering catalog/admin/loans + AI filters.
- [x] Pagination helper mirrored server/client (catalog/admin/loans APIs + composables now share `utils/pagination`).
- [x] AI prompt helper extracted (`server/utils/aiPrompts.ts` powering recommendation endpoint).
- [ ] Desk/admin UI sanitizers shared.
- [ ] Docs/context updated with new guidance.
- [ ] Lint/typecheck/manual smoke pass recorded.

Refer back to this document whenever expanding sanitization/hardening work so future agents stay aligned and duplication stays low.
