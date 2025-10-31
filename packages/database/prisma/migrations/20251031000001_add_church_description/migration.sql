-- Add description column to Church table
ALTER TABLE "Church" ADD COLUMN IF NOT EXISTS "description" TEXT;
