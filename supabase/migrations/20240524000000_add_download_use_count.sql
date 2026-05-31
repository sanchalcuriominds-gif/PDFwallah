-- Add downloadUseCount column to Order table
-- This tracks how many times a download token has been used
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "downloadUseCount" INTEGER NOT NULL DEFAULT 0;
