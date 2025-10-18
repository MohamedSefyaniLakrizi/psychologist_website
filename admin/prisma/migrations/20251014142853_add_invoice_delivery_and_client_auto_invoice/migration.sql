-- AlterEnum
ALTER TYPE "public"."EmailType" ADD VALUE 'INVOICE_DELIVERY';

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "sendInvoiceAutomatically" BOOLEAN NOT NULL DEFAULT true;
