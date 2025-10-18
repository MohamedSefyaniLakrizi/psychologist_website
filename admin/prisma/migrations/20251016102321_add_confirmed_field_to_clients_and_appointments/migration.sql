-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "confirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "confirmed" BOOLEAN NOT NULL DEFAULT false;
