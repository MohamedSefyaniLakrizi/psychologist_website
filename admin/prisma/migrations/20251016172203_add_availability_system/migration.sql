-- CreateEnum
CREATE TYPE "public"."ExceptionType" AS ENUM ('FULL_DAY', 'PARTIAL_DAY', 'DATE_RANGE');

-- CreateTable
CREATE TABLE "public"."WorkingHours" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvailabilityException" (
    "id" TEXT NOT NULL,
    "type" "public"."ExceptionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkingHours_weekday_idx" ON "public"."WorkingHours"("weekday");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_weekday_startTime_endTime_key" ON "public"."WorkingHours"("weekday", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "AvailabilityException_startDate_idx" ON "public"."AvailabilityException"("startDate");

-- CreateIndex
CREATE INDEX "AvailabilityException_endDate_idx" ON "public"."AvailabilityException"("endDate");
