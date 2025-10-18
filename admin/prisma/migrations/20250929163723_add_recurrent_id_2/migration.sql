/*
  Warnings:

  - You are about to drop the column `parentAppointmentId` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "parentAppointmentId";
