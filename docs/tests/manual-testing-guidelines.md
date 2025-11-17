# Manual Testing Guidelines

These steps let any teammate validate both functionality and hardening directly from `/debug`. Use the prebuilt buttons for smoke checks, then rely on the Custom HTTP Request tool for exhaustive coverage. Always note which Supabase session you are using (guest, member, staff/admin) before each suite of tests.

---
## 1. Using the Custom HTTP Request Tool
1. Pick the HTTP method and enter the exact path (relative `/api/...` or absolute `https://...`). Paths are sanitized before sending.
2. Headers textarea accepts `Key: Value` lines. Reset defaults for JSON (`Accept: application/json`, `Content-Type: application/json`). Add `Accept: text/event-stream` when testing SSE.
3. Bodies must be valid JSON; pretty-print with two-space indentation. Leave empty to omit a payload.
4. Toggle **Expect stream** for SSE endpoints so the tool reads raw text before running `parseSSEPayload`.
5. In dev builds, the browser console logs raw user input vs. sanitized payloads—use this to audit every request.

### Session Roles
- **Guest** – public checks only.
- **Member** – general catalog + AI endpoints.
- **Staff/Admin** – `/api/admin/*` and `/api/loans*` write access; renew also works for members on their own loans.

---
## 2. Health and Infrastructure
### `GET /api/check/openai` (stream, guest ok)
- **Happy path**: Method GET, path `/api/check/openai`, header `Accept: text/event-stream`, Expect stream enabled. Expect SSE events `ready`, multiple `token`, final `done`.
- **Hardening**: Drop the Accept header (should fail with 406 or auto-set). Tamper with path (`/api/check/../openai`) to confirm sanitizer blocks it.

### `GET /api/check/supabase` (guest ok)
- **Happy path**: Default headers; expect `{ status: "ok", time: ... }`.
- **Hardening**: Send POST (expect 405). Add invalid header names and confirm they are dropped in the console audit.

### Preview catalog (mock)
- **Happy path**: Ensure three mock items (from `useCatalogMock`) render unchanged.
- **Hardening**: Confirm console audit logs method `LOCAL` even though no HTTP request fires.

---
## 3. Catalog & Media Composables (`useCatalogData`, `useMediaDetail`)
### `GET /api/catalog?limit=9&mediaType=book` (member)
- Expect array plus pagination meta; compare to `app/pages/catalog.vue` expectations.
- **Hardening**: Remove/oversize `limit` (clamped). Inject markup in `mediaType` (expect 400 sanitizer error).

### `GET /api/catalog/:id` (member)
- Use an ID from the list call; validates `useMediaDetail`.
- **Hardening**: Invalid UUID → 400 with "Media ID must be a valid UUID." message.

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
- Expect `context`, `token`, `done` events forming coherent recommendations.
- **Hardening**:
  - PII scrub: include an email/phone; sanitized prompt in console should redact it.
  - Invalid enum: `filters.mediaType = "dvd"` should be ignored with explanation.
  - Limit clamp: `limit = 40` should cap at 12.
  - Prompt injection: include `</user_prompt>`; system instructions must remain in effect.
  - Rate limit: Send 35 rapid calls → expect 429 + retry window.

---
## 5. Admin Media Suite (`useAdminMediaData`, staff/admin)
### `GET /api/admin/media?page=1`
- Expect paginated list; `page=-1` coerces to 1.

### `POST /api/admin/media`
```
{
  "title": "Debug Sample",
  "creator": "Console Bot",
  "mediaType": "book",
  "mediaFormat": "print",
  "genre": "testing",
  "subject": "procedures",
  "description": "Created via /debug manual test"
}
```
- Expect 201 + new ID; missing required fields should produce validation errors.

### `PATCH /api/admin/media/:id`
- Minimal body `{ "title": "Updated via debug" }` should succeed; invalid UUID/empty body returns 400.

### `DELETE /api/admin/media/:id`
- Expect 204; deleting nonexistent ID returns 404 without leaking DB details.

---
## 6. Loans & Circulation (staff/admin; renew may be member)
### `GET /api/loans?page=1`
- Validate pagination; `page=abc` coerces to 1.

### `POST /api/loans`
```
{
  "memberId": "<member UUID>",
  "mediaId": "<media UUID>",
  "dueDate": "2025-12-01T12:00:00.000Z",
  "note": "Manual debug checkout"
}
```
- Expect 201 loan record; invalid UUIDs → 400, long notes (>500 chars) rejected/truncated.

### `POST /api/loans/:id/return`
- Body `{ "condition": "slightly worn", "notes": "Returned via debug" }`; blank body or bad ID should fail.

### `POST /api/loans/:id/renew`
- Body `{ "dueDate": "2026-01-15T00:00:00.000Z", "note": "extra week" }`; ensure members cannot renew someone else’s loan (expect 403).

---
## 7. Auth & Session (`useSupabaseAuth`, `useSupabaseClient`)
### `GET /api/debug/auth-check`
- **Happy path**: Expect `{ authenticated: true, user: ... }` while signed in.
- **Guest**: Sign out; expect `{ status: "guest" }` and UI label “Signed out”.
- **Timeout**: Simulate slow network; confirm 5s abort logs warning and page falls back to guest state.

---
## 8. Negative/Fuzz Regression Suite
- Header sanitization: paste 30+ malformed headers; parser should drop invalid entries (future UI validation will block submission entirely).
- Path traversal: `/api/admin/%2e%2e/secret` should be rejected client-side.
- Malformed JSON: send `{ "prompt":` (missing closing) → UI should report “Body must be valid JSON” without issuing a request.
- Unauthorized role: attempt admin endpoints as guest/member → expect 401/403 with no data leakage.
- PII redaction: include SSNs/emails/phones in prompts; sanitized prompt logged to console should redact them before upstream call.

Keep this document updated whenever you add new endpoints or composables: include Happy path, Hardening scenarios, and required session so future automation buttons can mirror the same coverage.
