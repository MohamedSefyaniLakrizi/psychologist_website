-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('NOT_YET_ATTENDED', 'ATTENDED', 'ABSENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RecurringType" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentAppointmentId" TEXT,
ADD COLUMN     "recurringEndDate" TIMESTAMP(3),
ADD COLUMN     "recurringType" "public"."RecurringType",
ADD COLUMN     "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'NOT_YET_ATTENDED';
