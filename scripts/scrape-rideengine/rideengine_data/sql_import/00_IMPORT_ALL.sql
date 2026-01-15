-- ============================================================================
-- RIDE ENGINE COMPLETE IMPORT
-- ============================================================================

-- USAGE:
-- psql -d your_database < 00_IMPORT_ALL.sql

BEGIN;

\i 01_ride_engine_brand.sql
\i 02_ride_engine_categories.sql
\i 03_ride_engine_products_all.sql
\i 04_verify_import.sql

COMMIT;
