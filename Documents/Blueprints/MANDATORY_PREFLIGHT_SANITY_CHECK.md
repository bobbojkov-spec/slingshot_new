# MANDATORY PREFLIGHT SANITY CHECK — SPEC

## Purpose (Non‑Negotiable)

This document defines a **mandatory preflight sanity check** that must exist in **every project**.
Its sole purpose is to **fail fast** and prevent deployments that are broken by configuration,
environment mismatch, missing services, or API/DB desynchronization.

If the preflight fails:
- the build **must stop**
- the deployment **must abort**
- no code changes are allowed to proceed

This is not optional.

---

## When This Must Run

The preflight check **must be executed before**:

- local development server start
- production build
- deployment (preview or live)
- CI/CD pipeline execution
- database migrations

---

## Execution Requirements

- Must be runnable via:

  ```bash
  node preflight-check.js
  ```

- Must work in:
  - local development
  - CI environments
  - production preview environments

- Must exit with:
  - `0` on success
  - `1` on any critical failure

Silent failures are forbidden.

---

## Core Responsibilities

The preflight script is responsible for validating:

1. Environment configuration
2. API reachability
3. API response correctness (JSON trap detection)
4. Backend health contract
5. Database connectivity
6. Environment parity (warnings only)

Each check below is **mandatory**.

---

## 1. Environment Resolution Check

### Goal
Ensure all required environment variables resolve deterministically.

### Rules
- API base URL must be resolved from:
  1. Explicit environment variable
  2. Explicit fallback (never implicit)
- Trailing slashes must be detected and warned
- Empty strings and undefined values are invalid

### Fail Conditions
- API base URL is missing
- API base URL is an empty string

---

## 2. API Reachability Check

### Goal
Confirm that the backend is reachable at the network and routing level.

### Rules
- Perform a `GET` request to:
  - API base URL, or
  - `/health` endpoint if available
- Measure response time (diagnostic only)

### Valid Responses
- `200 OK`
- `404 Not Found` (acceptable — confirms server is reachable)

### Fail Conditions
- DNS failure
- Network error
- Timeout
- No response

---

## 3. Content‑Type Validation (JSON Trap Detection)

### Goal
Prevent frontend crashes caused by HTML or text responses being parsed as JSON.

### Rules
- Inspect the `Content-Type` response header
- Response **must** include `application/json`

### Fail Conditions
- `text/html`
- `text/plain`
- missing `Content-Type` header

### Mandatory Error Message
```
CRITICAL: API returned non‑JSON response.
Likely causes:
- wrong API path
- backend route not deployed
- platform serving fallback HTML
```

---

## 4. Backend Health Contract Check

### Goal
Ensure the backend exposes a machine‑readable health contract.

### Required Rules
- Response body must be valid JSON
- Must include a `status` field
- `status` must equal `"ok"`

### Recommended Shape
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "latency": "23ms"
  },
  "env": {
    "node_env": "production"
  }
}
```

### Fail Conditions
- Invalid JSON
- Missing `status`
- `status` not equal to `"ok"`

---

## 5. Database Connectivity Check

### Goal
Detect situations where the backend is live but the database is not.

### Rules
- Backend must explicitly report database status
- Database status must be `"connected"`

### Fail Conditions
- Database reported as disconnected
- Database error present
- Backend does not expose database status

### Behavior on Failure
- Log database error (if provided)
- Exit immediately with failure code

---

## 6. Environment Parity Check (Warning Only)

### Goal
Surface silent configuration mismatches that commonly break deployments.

### Rules
- Compare:
  - `NODE_ENV`
  - resolved API base URL
  - runtime environment label
- These mismatches **do not fail** the build, but must be logged clearly

### Examples
- Production build using localhost API
- Development environment pointing to production database

---

## Output Requirements

### Success Output
- Clear success indicators
- Summary including:
  - API base URL
  - environment name
  - database status

### Failure Output
- One failure per line
- Human‑readable explanation
- Explicit action to take
- Exit code `1`

---

## CI/CD Enforcement Rule

- This preflight **must run before**:
  - build step
  - migration step
  - deployment step
- Pipelines **must abort automatically** if the preflight fails

---

## Absolute Prohibitions

- No silent failures
- No swallowed exceptions
- No continuing after database failure
- No JSON parsing before content‑type validation
- No skipping preflight “just this once”

---

## Agent Enforcement Rule

The agent is **not allowed** to:
- modify backend code
- modify frontend API usage
- modify deployment configuration

unless this preflight:
- passes locally
- passes in remote/CI environment

This rule is absolute.
