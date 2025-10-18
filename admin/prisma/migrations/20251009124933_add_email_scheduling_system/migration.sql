-- CreateEnum
CREATE TYPE "public"."EmailType" AS ENUM ('CONFIRMATION', 'REMINDER_24H', 'REMINDER_1H');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('PENDING', 'SENT', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."EmailSchedule" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "emailType" "public"."EmailType" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'PENDING',
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "EmailSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailSchedule_scheduledFor_idx" ON "public"."EmailSchedule"("scheduledFor");

-- CreateIndex
CREATE INDEX "EmailSchedule_status_idx" ON "public"."EmailSchedule"("status");

-- CreateIndex
CREATE INDEX "EmailSchedule_appointmentId_idx" ON "public"."EmailSchedule"("appointmentId");

-- AddForeignKey
ALTER TABLE "public"."EmailSchedule" ADD CONSTRAINT "EmailSchedule_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
