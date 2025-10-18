-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."Note" ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
