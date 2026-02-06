---
trigger: always_on
---

# USER_BOUNDARIES.md - Strict Interaction Constraints

> **CRITICAL:** These rules represent hard boundaries from the user to prevent workflow disruption. They override any conflicting instructions in other rule files.

## 1. BROWSER PROHIBITION (STRICT)
- **NEVER** open a browser window or use `browser_subagent`.
- **NEVER** use `search_web` or `read_url_content` without explicit user permission for a single, specific task.
- **NEVER** assume a task requires a browser. If you think it does, **ASK** first.

## 2. MINIMIZED EDITOR DISRUPTION
- **NO FULL FILE VIEWS (`view_file`) on open files.** Full reads of open files cause the cursor to jump and interrupt the user's focus.
- **USE TARGETED SEARCH:** Use `grep_search` or `view_code_item` to gather specific context instead of reading entire files.
- **EDITING:** When editing, use the most precise lines possible. Do not "select all" or replace entire files if a partial update suffices.
- **SILENT OPERATIONS:** Do not notify about every minor read or search. Keep the conversation focused on meaningful progress.
- **NO FILE-FOCUS DISRUPTION:** Do not trigger IDE file-open actions or selections that move the user’s cursor while they are typing.

## 3. ENFORCEMENT
- If an agent tool fails to respect these boundaries, it constitutes a **PROTOCOL VIOLATION**.
- Verify these boundaries at the start of every session.
