-- CreateEnum
CREATE TYPE "TeacherRole" AS ENUM ('Principal', 'Assistant');

-- CreateEnum
CREATE TYPE "PupilCategory" AS ENUM ('standard', 'staff', 'social', 'flagged');

-- CreateEnum
CREATE TYPE "PaymentClassificationType" AS ENUM ('standard', 'percent', 'amount', 'fixed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'approved', 'dismissed');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL DEFAULT '',
    "role" "TeacherRole" NOT NULL DEFAULT 'Assistant',

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherGroup" (
    "teacherId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "TeacherGroup_pkey" PRIMARY KEY ("teacherId","groupId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentClassification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentClassificationType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PaymentClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pupil" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL DEFAULT '',
    "category" "PupilCategory" NOT NULL DEFAULT 'standard',
    "condition" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Pupil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PupilParent" (
    "id" TEXT NOT NULL,
    "pupilId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PupilParent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PupilNote" (
    "id" TEXT NOT NULL,
    "pupilId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "PupilNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PupilTag" (
    "pupilId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PupilTag_pkey" PRIMARY KEY ("pupilId","tagId")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "pupilId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "baseFee" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "classificationId" TEXT,
    "customTerms" TEXT NOT NULL DEFAULT '',
    "billingActive" BOOLEAN NOT NULL DEFAULT true,
    "prorateFirstMonth" BOOLEAN NOT NULL DEFAULT false,
    "monthOverrides" JSONB NOT NULL DEFAULT '{}',
    "monthPaidAmountOverrides" JSONB NOT NULL DEFAULT '{}',
    "monthDueOverrides" JSONB NOT NULL DEFAULT '{}',
    "groupHistory" JSONB NOT NULL DEFAULT '[]',
    "classificationHistory" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "pupilId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "pupilFirstName" TEXT NOT NULL,
    "pupilSurname" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "documentFilename" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationParent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApplicationParent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationCustomValue" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ApplicationCustomValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pupil_idNumber_key" ON "Pupil"("idNumber");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGroup" ADD CONSTRAINT "TeacherGroup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGroup" ADD CONSTRAINT "TeacherGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PupilParent" ADD CONSTRAINT "PupilParent_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "Pupil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PupilNote" ADD CONSTRAINT "PupilNote_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "Pupil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PupilTag" ADD CONSTRAINT "PupilTag_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "Pupil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PupilTag" ADD CONSTRAINT "PupilTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "Pupil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "PaymentClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_pupilId_fkey" FOREIGN KEY ("pupilId") REFERENCES "Pupil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationParent" ADD CONSTRAINT "ApplicationParent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCustomValue" ADD CONSTRAINT "ApplicationCustomValue_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
