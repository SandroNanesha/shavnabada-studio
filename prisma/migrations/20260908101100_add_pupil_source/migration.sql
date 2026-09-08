-- CreateEnum
CREATE TYPE "PupilSource" AS ENUM ('manual', 'application');

-- AlterTable
ALTER TABLE "Pupil" ADD COLUMN     "source" "PupilSource" NOT NULL DEFAULT 'manual';
