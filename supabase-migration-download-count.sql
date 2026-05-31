-- =============================================
-- MIGRATION: Add downloadUseCount to Order table
-- =============================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This adds a column that tracks how many times a download token has been used.
-- Each token allows up to 3 downloads (for retry if download fails).

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "downloadUseCount" INTEGER NOT NULL DEFAULT 0;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Order' AND column_name = 'downloadUseCount';
