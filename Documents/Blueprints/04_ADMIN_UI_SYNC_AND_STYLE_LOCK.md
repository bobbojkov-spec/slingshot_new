# Blueprint 04 — Admin UI Sync, Form Safety, and Style Lock

## Purpose
Keep Admin UI reliable and prevent accidental regressions caused by:
- field names drifting from DB columns
- incomplete load/save wiring (ghost fields)
- missing save feedback (users don’t trust the system)
- uncontrolled agent refactors that break design parity

---

## 1) Admin ↔ DB alignment rules

### Rule 1 — 1:1 field mapping is mandatory
For every editable entity:
- each UI field maps to a specific DB column
- each DB column that must be editable has a UI field

If you do not enforce 1:1 mapping, you will eventually ship “ghost data”.

### Rule 2 — Two-way sync check (Inbound + Outbound)
For every field, verify both directions:
- **Inbound:** GET → UI state (explicit mapping)
- **Outbound:** UI state → payload (sanitization + correct key)

### Rule 3 — Symmetry in components
When a form contains similar fields (e.g., Title/Subtitle, Content/Narrative):
- implement them with the same patterns
- same validation rules
- same save semantics

### Rule 4 — Slugs
- Slugs are auto-generated from titles.
- Normalize: lowercase + hyphens, no spaces.
- Enforce uniqueness before save.

---

## 2) UX reliability rules (Admin)

### Rule 5 — Save state is not optional
Every save action must provide:
- Loading state
- Success toast
- Error toast with actionable message

### Rule 6 — Partial updates
- Prefer PATCH/PUT with only changed fields.
- Never overwrite entire objects unless explicitly intended.

### Rule 7 — Reorder is atomic
Reorder endpoints send only:
- `id`
- `position`

Never send the whole object for reorder.

---

## 3) Style Lock Protocol (Agent-proof)

### Rule 8 — Read-only UI shell
The agent is prohibited from modifying:
- existing Tailwind classes
- IDs
- HTML structure/layout wrappers

### Rule 9 — Content injection only
When generating or editing content:
- only insert content into the designated slot
- do not wrap content in new layout containers
- no inline styles

### Rule 10 — Table rendering is standardized
Tables must inherit global styling:
- use a single global table class (e.g., `className="app-table"`)
- no hard-coded widths, font sizes, or per-page styling

### Rule 11 — CSS extraction without refactoring
If extracting CSS:
- do not delete or simplify existing Tailwind classes
- add namespaced classes *in addition* to existing classes
- never merge “similar but different” styles

---

## 4) Agent instruction snippet (copy/paste)

**ADMIN UI SYNC + STYLE LOCK MODE**

- Do not change existing layout or Tailwind classes.
- For every form field, verify inbound mapping (GET → state) and outbound mapping (state → payload).
- Convert empty strings and the string "null" to literal null before hitting the DB.
- Enforce slug sanitization + uniqueness.
- Every Save must show loading + success/error feedback.

