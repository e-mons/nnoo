-- Migration: Add low_stock_threshold to catalog_items
-- Fixes dashboard reporting error where the column was referenced but didn't exist

ALTER TABLE public.catalog_items
ADD COLUMN low_stock_threshold numeric(14,6) NOT NULL DEFAULT 5;
