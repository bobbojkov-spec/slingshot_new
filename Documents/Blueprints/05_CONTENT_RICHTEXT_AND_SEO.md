# Blueprint 05 — Content, Rich Text, and SEO System

## Purpose
Standardize content editing + rendering across projects, and guarantee consistent SEO behavior.

Covers:
- Rich text editor spec (sanitized HTML)
- Universal SEO schema and fallbacks
- Admin UX patterns (preview + validation)

---

## 1) Rich text editing (safe HTML)

### Rule 1 — Store HTML, but allow only a small safe subset
Use a strict allowlist for tags. Recommended minimum:
- `<p>`, `<br>`
- `<b>`, `<i>`, `<u>`
- `<h3>` (or a controlled set of headings)

**Never** allow inline styles, classes, ids, or arbitrary attributes from pasted content.

### Rule 2 — Paste sanitization is mandatory
On paste:
1. intercept clipboard
2. prefer `text/html`, fallback to `text/plain`
3. sanitize with allowlist
4. strip all attributes
5. insert clean HTML

### Rule 3 — Rendering must unescape safely
If your DB stores escaped HTML entities, unescape on load/render consistently.

### Rule 4 — Styling is global and scoped
Do not embed style decisions inside the editor.
Use a single global content class, e.g.:
- `.content` or `.prose`

---

## 2) Universal SEO schema

### Rule 5 — The Big Six SEO columns
Every content-bearing table that can be accessed via a slug/URL should have these fields:
- `seo_title` (TEXT)
- `seo_description` (TEXT)
- `seo_keywords` (TEXT, comma-separated)
- `og_title` (TEXT)
- `og_description` (TEXT)
- `canonical_url` (TEXT)

### Rule 6 — Fallback behavior (API-level)
When serving content:
- if `og_title` is null → fallback to `seo_title`
- if `seo_title` is null → fallback to content title
- if `seo_description` is null → generate from content excerpt (first N chars)

### Rule 7 — Canonical URL generation
If `canonical_url` is missing on save, backend generates it:
- `https://<PROD_DOMAIN>/<route>/<slug>`

### Rule 8 — Drafts must not be indexed
Any draft/disabled content must emit `noindex`.

---

## 3) Slug integrity

### Rule 9 — Slugs are generated, sanitized, unique
- auto-generate from title
- normalize: lowercase, hyphens
- enforce uniqueness before save

---

## 4) Admin UI requirements

### Rule 10 — Reusable SEO panel
Create a shared `SEOPanel` used across all editors.
It should edit the Big Six and show live validation.

### Rule 11 — Preview requirement
Provide a live preview of how search results may look:
- URL (domain + slug)
- title
- description

### Rule 12 — Optional AI generator (nice-to-have)
If you add an “Auto-generate SEO” button:
- send a capped excerpt (e.g., first 1000 chars)
- return a ~60-char title and ~150-char description
- write into `seo_title` / `seo_description`
- still allow manual override

---

## 5) Agent instruction snippet (copy/paste)

**CONTENT + SEO MODE**

- Implement rich text with strict allowlisted HTML (strip all attributes).
- Sanitize pasted content; no Word/Office junk.
- Apply global typography via a single scoped CSS class.
- Ensure every slugged table has the Big Six SEO fields.
- Implement fallbacks (og→seo→title; description→excerpt).
- Enforce slug sanitization + uniqueness.
- Draft content must output `noindex`.
