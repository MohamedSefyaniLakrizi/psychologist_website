/*
  Warnings:

  - You are about to drop the `AvailabilityException` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkingHours` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."AvailabilityException";

-- DropTable
DROP TABLE "public"."WorkingHours";

-- DropEnum
DROP TYPE "public"."ExceptionType";

-- CreateTable
CREATE TABLE "public"."WeeklyAvailability" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DateAvailability" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DateAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyAvailability_weekday_idx" ON "public"."WeeklyAvailability"("weekday");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyAvailability_weekday_startTime_endTime_key" ON "public"."WeeklyAvailability"("weekday", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "DateAvailability_date_idx" ON "public"."DateAvailability"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DateAvailability_date_startTime_endTime_key" ON "public"."DateAvailability"("date", "startTime", "endTime");
