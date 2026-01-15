-- ============================================================================
-- RIDE ENGINE COMPLETE IMPORT (Brand-Based)
-- ============================================================================
-- All products assigned to 'Ride Engine' brand collection
-- Sport field set to WATERSPORTS (schema requirement, not used for classification)
--
-- Usage: psql your_database < 00_IMPORT_ALL.sql

BEGIN;

\i 01_ride_engine_collection.sql
\i 02_ride_engine_products_all.sql
\i 03_verify.sql

COMMIT;
