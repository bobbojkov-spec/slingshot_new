# Project Blueprint Pack (Project-Agnostic)

## What this is
A condensed, reusable ruleset you can copy into any repo (e.g., `/Documents` or `/docs`) and feed to an AI coding agent.

## Files
1. `01_ENV_REMOTE_LOCAL_DEPLOYMENT.md`
   - Environment rules, remote/local parity, build-time env “amnesia” prevention
2. `02_DATABASE_SCHEMA_AND_API_CONTRACTS.md`
   - DB integrity, schema alignment, API contract rules (incl. atomic reorder)
3. `03_MEDIA_ASSETS_AND_IMAGE_PIPELINE.md`
   - Private bucket signing, image variants, upload modes, file serving
4. `04_ADMIN_UI_SYNC_AND_STYLE_LOCK.md`
   - Admin form sync rules + “style lock” protocol + CSS extraction rules
5. `05_CONTENT_RICHTEXT_AND_SEO.md`
   - Rich text sanitization, SEO schema (“Big Six”), slug rules, previews
6. `06_DEBUGGING_SMOKETEST_AND_MOBILE.md`
   - Debugging protocol, sanity checks, smoke testing, mobile safety

## Recommended folder structure
- `/Documents/Blueprints/*` (these files)
- `/Documents/Prompts/*` (optional: copy/paste agent prompts)

## How to use with an agent
- First message to agent: **give it `01` + `04`** (prevents most damage).
- If working on DB/API: also provide `02`.
- If touching media: provide `03`.
- If touching content/SEO/editor: provide `05`.
- For deploy/debug cycles: provide `06`.
