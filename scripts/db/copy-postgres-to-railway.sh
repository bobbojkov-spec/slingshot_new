#!/usr/bin/env bash
set -euo pipefail

# One-time copy from SOURCE_DATABASE_URL -> DATABASE_URL using pg_dump | psql.
#
# Usage:
#   SOURCE_DATABASE_URL="postgres://..." DATABASE_URL="postgres://..." bash scripts/db/copy-postgres-to-railway.sh
#
# Notes:
# - Requires `pg_dump` and `psql` installed locally.
# - This is intentionally NOT run automatically on deploy.

if [[ -z "${SOURCE_DATABASE_URL:-}" ]]; then
  echo "Missing SOURCE_DATABASE_URL" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Missing DATABASE_URL" >&2
  exit 1
fi

echo "Copying DB (source -> target)..."
echo "  source: ${SOURCE_DATABASE_URL%%\?*}"
echo "  target: ${DATABASE_URL%%\?*}"
echo
echo "Dumping + restoring (this can take a while)..."

# --no-owner/--no-privileges makes restores less permission-sensitive.
pg_dump "$SOURCE_DATABASE_URL" --no-owner --no-privileges | psql "$DATABASE_URL"

echo "Done."


