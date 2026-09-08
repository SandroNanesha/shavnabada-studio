-- Ensure default studio exists before backfilling nulls
INSERT INTO "Studio" (id, name, slug, enabled, "createdAt")
VALUES ('default-studio', 'Shavnabada Studio', 'shavnabada', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Backfill all null studioId values to the default studio
UPDATE "Location"             SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Group"                SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Teacher"              SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Tag"                  SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "PaymentClassification" SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Pupil"                SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "ApplicationForm"      SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Application"          SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;
UPDATE "Settings"             SET "studioId" = 'default-studio' WHERE "studioId" IS NULL;

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_studioId_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationForm" DROP CONSTRAINT "ApplicationForm_studioId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_studioId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_studioId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentClassification" DROP CONSTRAINT "PaymentClassification_studioId_fkey";

-- DropForeignKey
ALTER TABLE "Pupil" DROP CONSTRAINT "Pupil_studioId_fkey";

-- DropForeignKey
ALTER TABLE "Settings" DROP CONSTRAINT "Settings_studioId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_studioId_fkey";

-- DropForeignKey
ALTER TABLE "Teacher" DROP CONSTRAINT "Teacher_studioId_fkey";

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "studioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ApplicationForm" ALTER COLUMN "studioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Group" ALTER COLUMN "studioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "studioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PaymentClassification" ALTER COLUMN "studioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Pupil" ALTER COLUMN "studioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "studioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "studioId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "studioId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentClassification" ADD CONSTRAINT "PaymentClassification_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pupil" ADD CONSTRAINT "Pupil_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationForm" ADD CONSTRAINT "ApplicationForm_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
