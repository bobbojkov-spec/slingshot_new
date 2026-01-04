#!/usr/bin/env bash
set -euo pipefail

# Export from Supabase Postgres → Import to Railway Postgres
#
# This script:
# 1. Exports schema + data from Supabase (via DATABASE_URL or SUPABASE_DATABASE_URL)
# 2. Imports it into Railway (via RAILWAY_DATABASE_URL)
#
# Usage:
#   SUPABASE_DATABASE_URL="postgres://..." RAILWAY_DATABASE_URL="postgres://..." bash scripts/db/export-supabase-to-railway.sh
#
# Or use env vars from .env.local:
#   source .env.local && RAILWAY_DATABASE_URL="postgres://..." bash scripts/db/export-supabase-to-railway.sh
#
# Note: Requires `pg_dump` and `psql` installed locally (brew install postgresql@17 or similar)
# Uses PostgreSQL 17 tools if available, falls back to system default

SUPABASE_DB="${SUPABASE_DATABASE_URL:-${DATABASE_URL:-}}"
# Remove query parameters (like ?pgbouncer=true) that pg_dump doesn't support
SUPABASE_DB="${SUPABASE_DB%%\?*}"

RAILWAY_DB="${RAILWAY_DATABASE_URL:-${DATABASE_URL:-}}"
# Remove query parameters from Railway URL too
RAILWAY_DB="${RAILWAY_DB%%\?*}"

if [[ -z "$SUPABASE_DB" ]]; then
  echo "Error: Missing SUPABASE_DATABASE_URL or DATABASE_URL (source Supabase DB)" >&2
  echo "Get it from: Supabase Dashboard → Project Settings → Database → Connection string (URI)" >&2
  exit 1
fi

if [[ -z "$RAILWAY_DB" ]] || [[ "$RAILWAY_DB" == "$SUPABASE_DB" ]]; then
  echo "Error: Missing RAILWAY_DATABASE_URL (target Railway DB)" >&2
  echo "Set RAILWAY_DATABASE_URL to your Railway Postgres connection string" >&2
  exit 1
fi

# Extract hostnames for display (without credentials)
SUPABASE_HOST=$(echo "$SUPABASE_DB" | sed -E 's|^postgresql?://[^@]+@([^:/]+).*|\1|')
RAILWAY_HOST=$(echo "$RAILWAY_DB" | sed -E 's|^postgresql?://[^@]+@([^:/]+).*|\1|')

echo "=========================================="
echo "Supabase → Railway Database Migration"
echo "=========================================="
echo ""
echo "Source (Supabase): $SUPABASE_HOST"
echo "Target (Railway):  $RAILWAY_HOST"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

TEMP_DUMP=$(mktemp /tmp/supabase-dump-XXXXXX.sql)

# Find pg_dump (prefer PostgreSQL 17, fallback to system default)
PG_DUMP_CMD="pg_dump"
if command -v /opt/homebrew/opt/postgresql@17/bin/pg_dump >/dev/null 2>&1; then
  PG_DUMP_CMD="/opt/homebrew/opt/postgresql@17/bin/pg_dump"
elif command -v /usr/local/opt/postgresql@17/bin/pg_dump >/dev/null 2>&1; then
  PG_DUMP_CMD="/usr/local/opt/postgresql@17/bin/pg_dump"
fi

PSQL_CMD="psql"
if command -v /opt/homebrew/opt/postgresql@17/bin/psql >/dev/null 2>&1; then
  PSQL_CMD="/opt/homebrew/opt/postgresql@17/bin/psql"
elif command -v /usr/local/opt/postgresql@17/bin/psql >/dev/null 2>&1; then
  PSQL_CMD="/usr/local/opt/postgresql@17/bin/psql"
fi

echo ""
echo "Step 1: Exporting schema + data from Supabase..."
echo "Using: $PG_DUMP_CMD"
echo "This may take a few minutes depending on database size..."
echo ""

# Export schema + data, excluding Supabase-specific system tables
# --no-owner --no-privileges: avoids permission issues
# --clean --if-exists: include DROP statements with IF EXISTS (safer)
$PG_DUMP_CMD "$SUPABASE_DB" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --format=plain \
  --verbose \
  --file="$TEMP_DUMP" \
  --exclude-table='auth.*' \
  --exclude-table='storage.*' \
  --exclude-table='realtime.*' \
  --exclude-table='extensions.*' \
  2>&1 | grep -v "^pg_dump: warning" || true

if [[ ! -s "$TEMP_DUMP" ]]; then
  echo "Error: Export file is empty or failed" >&2
  rm -f "$TEMP_DUMP"
  exit 1
fi

DUMP_SIZE=$(du -h "$TEMP_DUMP" | cut -f1)
echo "✓ Export complete: $DUMP_SIZE"
echo ""

echo "Step 2: Importing into Railway..."
echo ""

# Import into Railway
$PSQL_CMD "$RAILWAY_DB" -f "$TEMP_DUMP" 2>&1 | grep -v "^NOTICE" || true

echo ""
echo "=========================================="
echo "✓ Migration complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update DATABASE_URL in Railway to point to Railway Postgres"
echo "2. Test the application"
echo "3. Keep Supabase for Storage/Auth (those env vars stay the same)"
echo ""
echo "Note: Storage bucket files remain in Supabase - only database migrated."
echo ""

rm -f "$TEMP_DUMP"

