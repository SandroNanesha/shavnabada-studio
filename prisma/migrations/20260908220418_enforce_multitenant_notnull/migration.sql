-- Ensure default studio exists before backfilling nulls
INSERT INTO "Studio" (id, name, slug, enabled, "createdAt")
VALUES ('default-studio', 'Shavnabada Studio', 'shavnabada', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Backfill all null studioId values to the default studio
UPDATE "Location"              SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Group"                 SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Teacher"               SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Tag"                   SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "PaymentClassification" SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Pupil"                 SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "ApplicationForm"       SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Application"           SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Settings"              SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;

-- DropForeignKey (IF EXISTS — previous failed attempt may have already dropped them)
ALTER TABLE "Application"          DROP CONSTRAINT IF EXISTS "Application_studioId_fkey";
ALTER TABLE "ApplicationForm"      DROP CONSTRAINT IF EXISTS "ApplicationForm_studioId_fkey";
ALTER TABLE "Group"                DROP CONSTRAINT IF EXISTS "Group_studioId_fkey";
ALTER TABLE "Location"             DROP CONSTRAINT IF EXISTS "Location_studioId_fkey";
ALTER TABLE "PaymentClassification" DROP CONSTRAINT IF EXISTS "PaymentClassification_studioId_fkey";
ALTER TABLE "Pupil"                DROP CONSTRAINT IF EXISTS "Pupil_studioId_fkey";
ALTER TABLE "Settings"             DROP CONSTRAINT IF EXISTS "Settings_studioId_fkey";
ALTER TABLE "Tag"                  DROP CONSTRAINT IF EXISTS "Tag_studioId_fkey";
ALTER TABLE "Teacher"              DROP CONSTRAINT IF EXISTS "Teacher_studioId_fkey";

-- AlterTable — set NOT NULL now that all rows are backfilled
ALTER TABLE "Application"          ALTER COLUMN "studioId" SET NOT NULL;
ALTER TABLE "ApplicationForm"      ALTER COLUMN "studioId" SET NOT NULL;
ALTER TABLE "Group"                ALTER COLUMN "studioId" SET NOT NULL;
ALTER TABLE "Location"             ALTER COLUMN "studioId" SET NOT NULL;
ALTER TABLE "PaymentClassification" ALTER COLUMN "studioId" SET NOT NULL;
ALTER TABLE "Pupil"                ALTER COLUMN "studioId" SET NOT NULL;
ALTER TABLE "Settings"             ALTER COLUMN "studioId" SET NOT NULL;
ALTER TABLE "Tag"                  ALTER COLUMN "studioId" SET NOT NULL;
ALTER TABLE "Teacher"              ALTER COLUMN "studioId" SET NOT NULL;

-- AddForeignKey (IF NOT EXISTS — idempotent re-add)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Location_studioId_fkey') THEN
    ALTER TABLE "Location" ADD CONSTRAINT "Location_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Group_studioId_fkey') THEN
    ALTER TABLE "Group" ADD CONSTRAINT "Group_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Teacher_studioId_fkey') THEN
    ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tag_studioId_fkey') THEN
    ALTER TABLE "Tag" ADD CONSTRAINT "Tag_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentClassification_studioId_fkey') THEN
    ALTER TABLE "PaymentClassification" ADD CONSTRAINT "PaymentClassification_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Pupil_studioId_fkey') THEN
    ALTER TABLE "Pupil" ADD CONSTRAINT "Pupil_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApplicationForm_studioId_fkey') THEN
    ALTER TABLE "ApplicationForm" ADD CONSTRAINT "ApplicationForm_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Application_studioId_fkey') THEN
    ALTER TABLE "Application" ADD CONSTRAINT "Application_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Settings_studioId_fkey') THEN
    ALTER TABLE "Settings" ADD CONSTRAINT "Settings_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
