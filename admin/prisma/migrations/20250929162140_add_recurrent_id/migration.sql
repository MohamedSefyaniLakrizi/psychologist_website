-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "recurrentId" TEXT,
ALTER COLUMN "status" DROP NOT NULL;
