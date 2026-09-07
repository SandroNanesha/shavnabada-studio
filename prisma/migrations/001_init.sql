-- Shavnabada Studio — initial schema

CREATE TYPE "TeacherRole" AS ENUM ('Principal', 'Assistant');
CREATE TYPE "PupilCategory" AS ENUM ('standard', 'staff', 'social', 'flagged');
CREATE TYPE "PaymentClassificationType" AS ENUM ('standard', 'percent', 'amount', 'fixed');
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'approved', 'dismissed');

CREATE TABLE "Location" (
  "id"   TEXT PRIMARY KEY,
  "name" TEXT NOT NULL
);

CREATE TABLE "Group" (
  "id"         TEXT PRIMARY KEY,
  "name"       TEXT NOT NULL,
  "locationId" TEXT NOT NULL REFERENCES "Location"("id")
);

CREATE TABLE "Teacher" (
  "id"      TEXT PRIMARY KEY,
  "name"    TEXT NOT NULL,
  "contact" TEXT NOT NULL DEFAULT '',
  "role"    "TeacherRole" NOT NULL DEFAULT 'Assistant'
);

CREATE TABLE "TeacherGroup" (
  "teacherId" TEXT NOT NULL REFERENCES "Teacher"("id") ON DELETE CASCADE,
  "groupId"   TEXT NOT NULL REFERENCES "Group"("id")   ON DELETE CASCADE,
  PRIMARY KEY ("teacherId", "groupId")
);

CREATE TABLE "Tag" (
  "id"    TEXT PRIMARY KEY,
  "label" TEXT NOT NULL
);

CREATE TABLE "PaymentClassification" (
  "id"    TEXT PRIMARY KEY,
  "name"  TEXT NOT NULL,
  "type"  "PaymentClassificationType" NOT NULL,
  "value" DOUBLE PRECISION NOT NULL
);

CREATE TABLE "Pupil" (
  "id"        TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "surname"   TEXT NOT NULL,
  "idNumber"  TEXT NOT NULL UNIQUE,
  "birthDate" TEXT NOT NULL DEFAULT '',
  "category"  "PupilCategory" NOT NULL DEFAULT 'standard',
  "condition" TEXT NOT NULL DEFAULT '',
  "archived"  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "PupilParent" (
  "id"      TEXT PRIMARY KEY,
  "pupilId" TEXT NOT NULL REFERENCES "Pupil"("id") ON DELETE CASCADE,
  "name"    TEXT NOT NULL,
  "phone"   TEXT NOT NULL DEFAULT '',
  "order"   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "PupilNote" (
  "id"      TEXT PRIMARY KEY,
  "pupilId" TEXT NOT NULL REFERENCES "Pupil"("id") ON DELETE CASCADE,
  "date"    TEXT NOT NULL,
  "text"    TEXT NOT NULL
);

CREATE TABLE "PupilTag" (
  "pupilId" TEXT NOT NULL REFERENCES "Pupil"("id") ON DELETE CASCADE,
  "tagId"   TEXT NOT NULL REFERENCES "Tag"("id")   ON DELETE CASCADE,
  PRIMARY KEY ("pupilId", "tagId")
);

CREATE TABLE "Enrollment" (
  "id"                       TEXT PRIMARY KEY,
  "pupilId"                  TEXT NOT NULL REFERENCES "Pupil"("id") ON DELETE CASCADE,
  "groupId"                  TEXT NOT NULL REFERENCES "Group"("id"),
  "classificationId"         TEXT REFERENCES "PaymentClassification"("id"),
  "startDate"                TEXT NOT NULL,
  "endDate"                  TEXT,
  "baseFee"                  DOUBLE PRECISION NOT NULL,
  "discount"                 DOUBLE PRECISION NOT NULL DEFAULT 0,
  "customTerms"              TEXT NOT NULL DEFAULT '',
  "billingActive"            BOOLEAN NOT NULL DEFAULT true,
  "prorateFirstMonth"        BOOLEAN NOT NULL DEFAULT false,
  "monthOverrides"           JSONB NOT NULL DEFAULT '{}',
  "monthPaidAmountOverrides" JSONB NOT NULL DEFAULT '{}',
  "monthDueOverrides"        JSONB NOT NULL DEFAULT '{}',
  "groupHistory"             JSONB NOT NULL DEFAULT '[]',
  "classificationHistory"    JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE "Payment" (
  "id"           TEXT PRIMARY KEY,
  "pupilId"      TEXT NOT NULL REFERENCES "Pupil"("id")      ON DELETE CASCADE,
  "enrollmentId" TEXT NOT NULL REFERENCES "Enrollment"("id") ON DELETE CASCADE,
  "amount"       DOUBLE PRECISION NOT NULL,
  "date"         TEXT NOT NULL
);

CREATE TABLE "Application" (
  "id"              TEXT PRIMARY KEY,
  "pupilFirstName"  TEXT NOT NULL,
  "pupilSurname"    TEXT NOT NULL,
  "birthDate"       TEXT NOT NULL,
  "documentFilename" TEXT,
  "status"          "ApplicationStatus" NOT NULL DEFAULT 'pending',
  "submittedAt"     TEXT NOT NULL
);

CREATE TABLE "ApplicationParent" (
  "id"            TEXT PRIMARY KEY,
  "applicationId" TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE,
  "name"          TEXT NOT NULL,
  "phone"         TEXT NOT NULL DEFAULT '',
  "order"         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "ApplicationCustomValue" (
  "id"            TEXT PRIMARY KEY,
  "applicationId" TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE,
  "label"         TEXT NOT NULL,
  "value"         TEXT NOT NULL
);
