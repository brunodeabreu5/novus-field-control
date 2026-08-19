/*
  Warnings:

  - You are about to alter the column `amount` on the `billing_invoices` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - You are about to alter the column `monthly_amount` on the `tenant_billing_profiles` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.

*/
-- AlterTable
ALTER TABLE "billing_invoices" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "tenant_billing_profiles" ALTER COLUMN "monthly_amount" SET DATA TYPE DECIMAL(14,2);
