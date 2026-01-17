# Blueprint 02 — Database, Schema Integrity, and API Contracts

## Purpose
Make backend + admin UI **impossible to drift**. Prevent classic failures:
- `invalid input syntax for type uuid: "null"`
- “ghost fields” (UI saves a field the DB doesn't have, or UI doesn't load saved data)
- broken reorder endpoints that overwrite whole objects

---

## 1) Schema is the source of truth

### Rule 1 — DB generates IDs
- All primary keys are DB-generated (UUIDs recommended).
- No manual IDs in POST payloads.

### Rule 2 — Strict typing at the API boundary
- The API layer must convert:
  - `""` → `null` (for nullable fields)
  - `"null"` (string) → `null` (literal)
  - `"undefined"` (string) → `null`
- UUID columns **must never** receive stringified null.

### Rule 3 — Foreign keys must exist
Before any insert/update, validate that foreign keys exist:
- `category_id` must exist in `categories`
- `owner_id` must exist in `users`

**Preferred:** enforce with DB constraints *and* return a clean error.

---

## 2) DB/UI mapping rules

### Rule 4 — 1:1 naming or an explicit mapper
Pick ONE strategy and enforce it everywhere:

1) **1:1 field naming** (recommended for speed)
- Admin input names match DB column names exactly.

2) **Mapper layer**
- UI uses camelCase, DB uses snake_case.
- Must have a centralized mapping function:
  - `toDb(payload)`
  - `fromDb(row)`

### Rule 5 — Two-way sync check (Inbound + Outbound)
For **every field**:
- **Inbound:** GET response maps into UI state
- **Outbound:** UI state maps into PUT/POST payload

If either direction is missing, the field is “ghosted”.

---

## 3) API contract requirements

### Rule 6 — Atomic updates for reorder
Reorder endpoints must send **only**:
- `id`
- `position` (or `sort_order`)

Never send the whole object.

### Rule 7 — Error transparency in development
In development mode, backend responses should include:
- error message
- DB error detail/hint (when safe)

In production, sanitize errors.

### Rule 8 — File endpoints support byte ranges
If you serve large PDFs/videos, the endpoint must support:
- HTTP `206 Partial Content`
- `Range` requests

This prevents mobile browser crashes.

---

## 4) Canonical validators (pseudo)

### 4.1 Payload normalization (do this before DB queries)
```ts
function normalizePayload(payload: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === '' || v === 'null' || v === 'undefined') out[k] = null;
    else out[k] = v;
  }
  return out;
}
```

### 4.2 UUID guard
```ts
function isUuid(v: unknown): boolean {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}
```

---

## 5) “Schema extraction” workflow (agent-safe)

### Step 1 — Extract columns from the DB
- For each table used by UI, extract:
  - column name
  - type
  - nullable
  - defaults

### Step 2 — Generate a mapping table
For each UI form:
- field name
- DB column
- type
- nullable
- sanitize/transform rules

### Step 3 — Scripted verification
Write a temporary test that:
- simulates POST/PUT for each entity
- ensures the DB accepts payloads
- fails CI if any route produces HTML/non-JSON

---

## 6) Minimum guarantees checklist
- [ ] All PKs are DB-generated UUIDs
- [ ] No UUID column receives `"null"`
- [ ] All FKs validated (or constrained) before write
- [ ] Every UI field has inbound + outbound mapping
- [ ] Reorder endpoints are atomic (id + position)
- [ ] Large file endpoints support Range/206
