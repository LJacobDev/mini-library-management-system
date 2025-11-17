# Manual Testing Guidelines (v2)

This iteration expands the `/debug` playbook to cover every current endpoint, UI safeguard, and hardening measure. Use the quick buttons for smoke checks, then lean on the Custom HTTP Request tool for exhaustive verification. Always note which Supabase session you are using (guest, member, staff/admin) before each suite of tests.

---
## 1. Using the Custom HTTP Request Tool
1. Pick the HTTP method and enter the exact path (relative `/api/...` or absolute `https://...`). Paths that fail `sanitizePathInput` (blank, `ftp://`, traversal attempts) should be caught before the request fires.
2. Headers textarea accepts `Key: Value` lines. Reset defaults for JSON (`Accept: application/json`, `Content-Type: application/json`). Add `Accept: text/event-stream` when testing SSE.
3. Bodies must be valid JSON; pretty-print with two-space indentation. Empty body => no payload. Invalid JSON should trigger the UI error “Body must be valid JSON”.
4. Toggle **Expect stream** for SSE endpoints so the tool reads raw text before running `parseSSEPayload`.
5. Dev builds log raw user input vs. sanitized payloads (via `logDebugAudit`). Ensure the console shows both entries for every run.
6. When header validation (point 3) ships, paste >20 headers or invalid keys to confirm the UI blocks submission and highlights errors.

### Session Roles
- **Guest** – public checks only.
- **Member** – catalog + AI endpoints; can renew their own loans.
- **Staff/Admin** – `/api/admin/*`, `/api/loans*`, and dashboard/desk utilities.

---
## 2. Health and Infrastructure
### `GET /api/check/openai` (stream, guest ok)
- **Happy path**: GET `/api/check/openai`, header `Accept: text/event-stream`, Expect stream enabled → expect SSE events `ready`, multiple `token`, final `done`.
- **Hardening**:
  - Remove `Accept` header (should fail with 406 or auto-set by client).
  - Use `/api/check/../openai` or `ftp://` (client should reject before network).
  - Block the response midway to confirm the SSE parser handles missing `event:`/`data:` pairs without crashing.

### `GET /api/check/supabase` (guest ok)
- **Happy path**: Expect `{ status: "ok", time: ... }`.
- **Hardening**: POST should return 405. Add invalid headers; audit log should show they were dropped.

### `/api/status` (if enabled)
- Verify uptime + dependency checks, then simulate degraded supabase (flip env or use local mock) to confirm 5xx propagation.

### Preview catalog (mock)
- Ensure three mock entries from `useCatalogMock` render, and the console audit logs method `LOCAL` with no network traffic.

---
## 3. Catalog & Media Composables
### `GET /api/catalog?limit=9&mediaType=book` (member)
- Validate list + pagination vs. `useCatalogData` expectations.
- **Hardening**: remove/oversize `limit` (clamped to 12). Inject HTML/script in `mediaType` (expect 400 sanitizer error). Try `mediaType=BOOK` to confirm case normalization.

### `GET /api/catalog/:id` (member)
- Use an ID from the list call; ensures `useMediaDetail` receives full metadata.
- **Hardening**: invalid UUID → 400 with "Media ID must be a valid UUID.". Try visiting the page via Nuxt router (catalog detail view) to confirm middleware handles 404 gracefully.

### Composable cross-checks
- `useCatalogData` should expose `items`, `meta`, `isLoading`, `error`—toggle network offline to confirm fallback states.
- `useMediaDetail` should clear stale entries when ID changes; navigate between two detail IDs quickly to ensure watchers reset state.

---
## 4. AI Recommendation Flow (`useAgentChat`, `useAiStream`)
### `POST /api/ai/recommend` (member, stream)
```
Headers: Accept: text/event-stream, Content-Type: application/json
Body: {
  "prompt": "I love optimistic space opera with diverse crews",
  "filters": { "mediaType": "book", "limit": 4 }
}
```
- Expect `context`, `token`, `metadata`, `done` events building a coherent recommendation string.
- Validate `useAiStream` properly appends tokens and emits final metadata.

**Hardening matrix**
- **PII scrub**: prompt contains email/phone/SSN → console log’s sanitized prompt should redact it before request leaves browser.
- **Enum enforcement**: `filters.mediaType = "dvd"` → server ignores filter and returns warning metadata.
- **Limit clamp**: send `limit = 40`; response metadata should show max 12.
- **Prompt injection**: include `</user_prompt>` and system override attempts; verify final output still references guardrails.
- **Rate limiting**: fire >30 requests/min (use script or rapid clicks) → expect 429 with `retryAfter` metadata, and ensure limiter resets after window.
- **Malformed body**: send string for `filters` or omit prompt → server returns detailed validation error.

---
## 5. Admin Media Suite (`useAdminMediaData`)
Requires staff/admin session.

### `GET /api/admin/media?page=1`
- Validate pagination + filters; confirm `useAdminMediaData` stores last query and exposes `refresh()`.
- **Hardening**: `page=-1` or `page=abc` should default to 1; large page should clamp to max.

### `POST /api/admin/media`
- Use sample body above; ensure 201 returns new ID that appears in subsequent GET.
- **Hardening**: missing `title` or invalid `mediaType` should return structured 422 error; ensure UI surfaces it.

### `PATCH /api/admin/media/:id`
- Modify `title` and `genre`; ensure audit log shows sanitized payload. Invalid UUID or empty body should 400.

### `DELETE /api/admin/media/:id`
- Deleting existing record returns 204; deleting nonexistent returns 404 without leaking details. Verify UI handles both.

### `AdminMediaFormModal` & dashboard flows
- Open the modal via `/dashboard/desk`, submit valid+invalid forms, ensure client-side validators align with server rules.
- Confirm optimistic updates roll back if API fails (network offline scenario).

---
## 6. Loans & Circulation
Requires staff/admin for checkout/return; renew may be member for own loans.

### `GET /api/loans?page=1`
- Validate data shape vs. UI tables; `page=abc` should coerce to 1.

### `POST /api/loans`
```
{
  "memberId": "<member UUID>",
  "mediaId": "<media UUID>",
  "dueDate": "2025-12-01T12:00:00.000Z",
  "note": "Manual debug checkout"
}
```
- Expect 201; invalid UUIDs → 400; notes >500 chars rejected/truncated—double-check response message and UI toast.

### `POST /api/loans/:id/return`
- Provide `condition` + `notes`; blank body should error. Ensure audit log shows sanitized text (control chars replaced).

### `POST /api/loans/:id/renew`
- Body `{ "dueDate": "2026-01-15T00:00:00.000Z", "note": "extra week" }`.
- **Security**: log in as another member—endpoint should 403. Also test staff renewing after reservations exist (if implemented) to ensure server rejects conflicting states.

### Future reservation endpoints
- If `/api/loans/reservations` exists, add analogous tests (create/list/cancel) with role checks.

---
## 7. Account / Dashboard APIs
- **`GET /api/account/profile`**: member session should return profile; guest should 401. Tamper with Supabase hash to ensure middleware invalidates session.
- **`POST /api/account/profile`**: update name/preferences; invalid payload should 422.
- **Dashboard/desk endpoints** (e.g., `/api/dashboard/metrics`, `/api/dashboard/desk/actions`): run via custom requests to ensure staff-only access and throttling.

---
## 8. Auth & Session Plumbing
### `/api/debug/auth-check`
- Happy path vs. guest vs. timeout already covered. Also test stale JWT (delete cookies mid-session) to ensure endpoint returns 401 and `/debug` redirects.

### Middleware behavior
- `auth.global.ts`: navigate to `/dashboard` as guest → expect redirect to `/login`.
- `guest.global.ts`: navigate to `/login` while authenticated → expect redirect to `/dashboard`.
- `supabase-hash.global.ts`: change stored hash (manually edit localStorage) → middleware should force refresh + revalidation.

### `useSupabaseAuth` composable
- Sign in/out via UI and ensure reactive state updates everywhere (header, debug console, dashboard cards).

---
## 9. Custom Request Tool & UI Hardening
1. **Path sanitization**: enter blank path, `ftp://evil`, `/api/admin/../secret`; ensure UI blocks send and displays error.
2. **Header limits**: add >20 headers or invalid characters; once validation UI lands, expect inline errors + disabled submit.
3. **Body validation**: paste malformed JSON; confirm `customError` shows detailed message without hitting server.
4. **SSE toggle**: send SSE endpoint without toggling—should default Accept header to JSON; toggle ON and ensure Accept updates to `text/event-stream`.
5. **Audit logs**: run multiple requests and verify console shows raw vs sanitized payloads with timestamps; confirm logs only appear in dev builds.
6. **Manual guidelines modal**: open, verify Markdown renders from this file (after we wire it in), ensuring testers have live reference.

---
## 10. Negative / Fuzz Regression Suite
- **Header fuzzing**: random binary data in headers should be stripped or rejected.
- **Path traversal**: `%2e%2e`, `%5c` variations should never reach server.
- **JSON bombs**: extremely nested JSON should be rejected client-side (optional) or server returns 413/422.
- **Rate limit bypass**: attempt to change IP via query param; limiter should still use real IP and block.
- **PII leakage**: confirm sanitized prompts + server logs never contain raw PII after each AI test.
- **SSE abuse**: send SSE response with huge tokens or missing newline separators (use mock server) to ensure parser doesn’t crash UI.
- **Role escalation attempts**: modify request headers to spoof `x-role`; server should ignore client-provided role hints.

---
## 11. Documentation & Follow-up
- Record which tests were run (date/user) in `/agents/agent-fast-start-context.md` or QA log.
- When adding new endpoints or composables, extend this doc with: endpoint name, required session, happy path JSON, hardening scenarios, UI entry points.
- Next step: create automation buttons in `/debug` using these recipes so QA can run suites with one click.
