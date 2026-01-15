-- ============================================================================
-- RIDE ENGINE COMPLETE IMPORT (Prisma Compatible)
-- ============================================================================

-- Connect to your database and run:
-- psql postgresql://user:pass@host/db < 00_IMPORT_ALL.sql

BEGIN;

\i 01_ride_engine_collection.sql
\i 02_ride_engine_products_all.sql
\i 03_verify.sql

COMMIT;
