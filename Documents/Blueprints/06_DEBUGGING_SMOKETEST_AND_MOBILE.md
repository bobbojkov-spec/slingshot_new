# Blueprint 06 — Debugging Protocol, Smoke Tests, and Mobile Safety

## Purpose
Provide a repeatable way to:
- identify whether failures are frontend vs backend vs network vs DB
- prevent HTML/404 responses from masquerading as JSON
- run fast smoke tests after changes and before deployment
- keep heavy media views stable on mobile

---

## 1) The four-layer debug model

When something breaks, classify it first:
1) **Frontend config** (wrong base URL, relative calls, missing build-time vars)
2) **Backend routing** (endpoint missing, wrong prefix, proxy mismatch)
3) **Network/CORS** (blocked origin, missing headers)
4) **Backend dependencies** (DB disconnected, bucket keys missing)

Do not “hunt randomly” across layers.

---

## 2) JSON trap detection (critical)

### Rule 1 — Frontend must detect non-JSON responses
If an API call returns HTML/text, treat it as an immediate configuration failure.
Typical symptom:
- `Unexpected token '<'`

### Rule 2 — Backend should never return HTML for /api routes
Install a catch-all after routes:
- for `/api/*` that is not matched, return JSON 404, not a server-rendered page.

---

## 3) Preflight checklist (before every push)

Must pass locally:
- build succeeds
- types pass
- API base URL resolved correctly
- backend starts cleanly
- DB connection is verified or errors are clearly reported

Recommended commands (adapt to your repo):
- `npm run build`
- `npm test` or `npm run typecheck`
- `npm run check` (see sanity check script below)

---

## 4) Sanity check script (local machine hits production URL)

Maintain a tiny script (Node) that:
- prints the resolved API URL
- tests reachability
- checks `content-type` includes `application/json`
- optionally hits `/api/health` and asserts DB is connected

This is the fastest way to prove whether prod is healthy without redeploying.

---

## 5) Smoke testing

### Rule 3 — Smoke test must hit the “critical endpoints”
Define a list of key endpoints for your system (examples):
- pages list
- categories list
- homepage config
- admin protected endpoints (while authenticated)

Verify:
- status codes
- JSON shape
- presence of SEO fields where expected

### Optional: Automated crawler
For link-heavy sites, use a crawler that:
- traverses pages
- logs 404s
- detects “0 results” screens by selector/text
- exports CSV for quick triage

---

## 6) Emergency connectivity isolation (use carefully)

If you are blocked by CORS and need 10 minutes to confirm connectivity:
- temporarily allow all origins on backend
- deploy
- confirm requests succeed
- revert to a restricted allowlist

Important:
- this is a diagnostic step, not a final architecture

---

## 7) Mobile performance rules

### Rule 4 — Adaptive rendering for heavy media
If a page contains high-memory media (large PDFs, flipbooks, long videos):
- switch to a mobile-friendly “lite” mode (vertical scroll, native viewer)
- support pinch-to-zoom with a native-feeling interaction library

### Rule 5 — Range requests for large files
If you serve PDFs/videos from your backend:
- support HTTP **206 Partial Content** (Byte-Range)
This avoids mobile crashes and enables streaming.

---

## 8) Agent instruction snippet (copy/paste)

**DEBUG + STABILITY MODE**

- First classify the failure: frontend config vs backend routing vs CORS vs dependency.
- Add non-JSON detection in the API client and a JSON 404 for unmatched `/api/*` routes.
- Provide a preflight command set and a sanity-check script that can test a production URL from local.
- Add smoke tests for critical endpoints.
- Ensure heavy media routes support HTTP range requests; mobile uses adaptive rendering.
