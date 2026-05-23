-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('PYG', 'BRL', 'USD');

-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('starter', 'growth', 'enterprise');

-- CreateEnum
CREATE TYPE "BillingProfileStatus" AS ENUM ('active', 'grace', 'suspended', 'canceled');

-- CreateEnum
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('draft', 'issued', 'paid', 'overdue', 'voided');

-- CreateEnum
CREATE TYPE "ProvisioningProjectStatus" AS ENUM ('planned', 'active', 'blocked', 'completed');

-- CreateTable
CREATE TABLE "tenant_billing_profiles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan" "BillingPlan" NOT NULL DEFAULT 'starter',
    "currency" "Currency" NOT NULL DEFAULT 'PYG',
    "monthly_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "BillingProfileStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_billing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "billing_profile_id" UUID,
    "number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provisioning_projects" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_name" TEXT,
    "status" "ProvisioningProjectStatus" NOT NULL DEFAULT 'planned',
    "started_at" DATE,
    "target_go_live_at" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "provisioning_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_billing_profiles_tenant_id_key" ON "tenant_billing_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_billing_profiles_status_plan_idx" ON "tenant_billing_profiles"("status", "plan");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_number_key" ON "billing_invoices"("number");

-- CreateIndex
CREATE INDEX "billing_invoices_tenant_id_status_idx" ON "billing_invoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "billing_invoices_billing_profile_id_idx" ON "billing_invoices"("billing_profile_id");

-- CreateIndex
CREATE INDEX "provisioning_projects_tenant_id_status_idx" ON "provisioning_projects"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "provisioning_projects_status_name_idx" ON "provisioning_projects"("status", "name");

-- AddForeignKey
ALTER TABLE "tenant_billing_profiles" ADD CONSTRAINT "tenant_billing_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_billing_profile_id_fkey" FOREIGN KEY ("billing_profile_id") REFERENCES "tenant_billing_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisioning_projects" ADD CONSTRAINT "provisioning_projects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
