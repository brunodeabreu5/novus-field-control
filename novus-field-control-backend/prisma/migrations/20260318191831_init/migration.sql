-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('owner', 'admin', 'support');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'inactive', 'suspended', 'provisioning');

-- CreateTable
CREATE TABLE "control_admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "control_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_sessions" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "control_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "company_code" TEXT,
    "display_name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'provisioning',
    "api_base_url" TEXT NOT NULL,
    "ws_base_url" TEXT NOT NULL,
    "web_base_url" TEXT NOT NULL,
    "assets_base_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "control_admins_email_key" ON "control_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "control_sessions_refresh_token_key" ON "control_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "control_sessions_admin_id_idx" ON "control_sessions"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_company_code_key" ON "tenants"("company_code");

-- CreateIndex
CREATE INDEX "tenants_status_display_name_idx" ON "tenants"("status", "display_name");

-- AddForeignKey
ALTER TABLE "control_sessions" ADD CONSTRAINT "control_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "control_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
