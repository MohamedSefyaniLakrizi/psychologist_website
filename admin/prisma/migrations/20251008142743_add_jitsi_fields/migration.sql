-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "clientAttended" BOOLEAN,
ADD COLUMN     "clientJwt" TEXT,
ADD COLUMN     "hostAttended" BOOLEAN,
ADD COLUMN     "hostJwt" TEXT;
