/*
  Migration: product colors visibility

  Uses a boolean flag to track whether a color should appear in the availability matrix.
*/

ALTER TABLE product_colors
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

