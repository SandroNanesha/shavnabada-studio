ALTER TABLE "ApplicationForm" ADD COLUMN IF NOT EXISTS "disabledPredefined" JSONB NOT NULL DEFAULT '[]';
