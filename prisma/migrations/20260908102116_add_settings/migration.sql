-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "futureMonths" INTEGER NOT NULL DEFAULT 2,
    "platformLogo" TEXT NOT NULL DEFAULT '',
    "formLogo" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
