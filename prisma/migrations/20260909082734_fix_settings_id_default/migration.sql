-- Fix Settings_pkey: replace hardcoded 'singleton' default with a real id default
-- First fix any existing rows that got id='singleton'
UPDATE "Settings" SET id = gen_random_uuid()::text WHERE id = 'singleton';

-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
