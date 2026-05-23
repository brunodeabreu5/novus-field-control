export type Language = "es" | "pt" | "en";
export type Currency = "PYG" | "BRL" | "USD";

export type AdminRole = "owner" | "admin" | "support";
export type TenantStatus = "active" | "inactive" | "suspended" | "provisioning";
export type BillingPlan = "starter" | "growth" | "enterprise";
export type BillingProfileStatus = "active" | "grace" | "suspended" | "canceled";
export type BillingInvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "voided";
export type ProvisioningProjectStatus = "planned" | "active" | "blocked" | "completed";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface TenantSummary {
  id: string;
  slug: string;
  displayName: string;
  status: TenantStatus;
}

export interface BillingProfile {
  id: string;
  tenantId: string;
  plan: BillingPlan;
  currency: Currency;
  monthlyAmount: number;
  status: BillingProfileStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCounts {
  provisioningProjects: number;
  billingInvoices: number;
}

export interface Tenant {
  id: string;
  slug: string;
  companyCode: string | null;
  displayName: string;
  status: TenantStatus;
  baseDomain: string;
  apiBaseUrl: string;
  wsBaseUrl: string;
  webBaseUrl: string;
  assetsBaseUrl: string | null;
  createdAt: string;
  updatedAt: string;
  billingProfile?: BillingProfile | null;
  _count?: TenantCounts;
}

export interface TenantListResponse {
  items: Tenant[];
  total: number;
  summary: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    provisioning: number;
  };
}

export interface TenantPayload {
  slug: string;
  companyCode?: string;
  displayName: string;
  status: TenantStatus;
  baseDomain: string;
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  webBaseUrl?: string;
  assetsBaseUrl?: string;
}

export interface ProvisioningProject {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  ownerName: string | null;
  status: ProvisioningProjectStatus;
  startedAt: string | null;
  targetGoLiveAt: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: TenantSummary;
}

export interface ProvisioningProjectPayload {
  tenantId: string;
  name: string;
  description?: string;
  ownerName?: string;
  status: ProvisioningProjectStatus;
  startedAt?: string;
  targetGoLiveAt?: string;
}

export interface ProvisioningProjectListResponse {
  items: ProvisioningProject[];
  total: number;
  summary: {
    total: number;
    planned: number;
    active: number;
    blocked: number;
    completed: number;
  };
}

export interface BillingInvoice {
  id: string;
  tenantId: string;
  billingProfileId: string | null;
  number: string;
  amount: number;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  status: BillingInvoiceStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: TenantSummary;
}

export interface BillingInvoicePayload {
  tenantId: string;
  number: string;
  amount: number;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  status: BillingInvoiceStatus;
  description?: string;
}

export interface BillingInvoicesResponse {
  items: BillingInvoice[];
  total: number;
  summary: {
    total: number;
    paid: number;
    issued: number;
    overdue: number;
    draft: number;
  };
}

export interface TenantBillingResponse {
  tenant: TenantSummary;
  profile: BillingProfile;
  invoices: BillingInvoice[];
  summary: {
    invoiceCount: number;
    totalOutstanding: number;
    totalPaid: number;
    overdueCount: number;
  };
}

export interface TenantBillingProfilePayload {
  plan?: BillingPlan;
  currency?: Currency;
  monthlyAmount?: number;
  status?: BillingProfileStatus;
  notes?: string;
}
