# Blueprint 03 — Media Assets, Image Pipeline, and Private Buckets

## Purpose
Define a safe, repeatable media architecture that works locally and on PaaS (Railway, Render, Fly, etc.), especially when using **private S3-compatible buckets**.

Stops these failures:
- broken images in production due to missing signing keys
- “double-signed” URLs
- accidentally storing full https URLs in the database
- unpredictable image sizes and slow pages

---

## 1) Core philosophy: Server-Side Signing

### Rule 1 — Database stores paths, not URLs
- DB stores **relative paths only** (e.g., `products/abc.jpg`).
- Never store `https://...` in a `path` column.

### Rule 2 — Backend signs and returns ready-to-use URLs
- Backend converts stored path → signed URL.
- Frontend **must not** sign, parse, or modify URLs.

### Rule 3 — No double-signing
If a value already contains `http` or a `signature`/`X-Amz-` query, treat it as a bug.
- Fix upstream: store only paths.

---

## 2) Bucket security and environment variables

### Required vars (names are examples)
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

Rules:
- Backend must fail fast if signing vars are missing in production.
- Keep separate credentials per environment (dev vs prod).

---

## 3) Image variants: predictable, fast, regenerable

### Rule 4 — Non-destructive pipeline
- Always preserve the **original**.
- Derived variants can be regenerated anytime.

### Standard variants (recommended)
- `original` — exact uploaded bytes
- `thumb` — small square or short edge ~200–400px
- `medium` — content listing size ~800–1200px
- `full` — max display size (cap at ~2000–3000px long edge)

### Rule 5 — Always serve the smallest acceptable variant
Frontend must choose `thumb/medium/full` depending on context.

---

## 4) Upload modes

### 4.1 Single upload with optional crop tool
- Crop tool is **client-side** and optional.
- User may select aspect ratio (e.g., 3:4, 16:9).
- Backend does not “guess”; it processes exactly what it receives.

### 4.2 Multi-upload (no crop tool)
- Multiple image uploads must skip cropping.
- Batch operations must be deterministic and reversible.

---

## 5) Canonical database schema for images

Recommended table (adapt names as needed):

- `id` UUID PK
- `entity_type` TEXT (optional polymorphic) OR foreign key (`product_id`, etc.)
- `path_original` TEXT (relative)
- `path_thumb` TEXT (relative)
- `path_medium` TEXT (relative)
- `path_full` TEXT (relative)
- `width` INT, `height` INT (original)
- `mime` TEXT
- `size_bytes` BIGINT
- `alt` TEXT (optional)
- `created_at` TIMESTAMPTZ

**Rule 6:** If you store variants in one column, store them as JSONB but still store **paths only**.

---

## 6) Canonical API behavior

### 6.1 Upload endpoints
Two safe patterns:

**Pattern A — Backend receives file bytes**
- `POST /api/uploads` (multipart)
- Backend: validates → writes original → generates variants → writes DB → returns signed URLs

**Pattern B — Presigned upload (recommended for large files)**
- `POST /api/uploads/presign` → returns `{ uploadUrl, path, headers }`
- Client uploads directly to bucket
- `POST /api/uploads/commit` → backend generates variants (if needed) + DB record

### 6.2 Read endpoints
- Return image objects with:
  - stored paths (optional)
  - **signed URLs** per variant

**Rule 7:** never leak private bucket paths to public clients without signing.

---

## 7) File serving: byte-range support (PDF/video)

### Rule 8 — Support HTTP 206 range requests
If you serve PDFs/video via your backend, support:
- `Range` header
- `206 Partial Content`

This prevents mobile crashes on large media.

---

## 8) Production checklist

- [ ] DB contains only relative paths (no `http`, no query strings)
- [ ] Backend has signing env vars in the correct environment scope
- [ ] Backend returns signed URLs; frontend does not modify them
- [ ] Variants exist (or are generated) for every image
- [ ] Large files support byte-range requests

