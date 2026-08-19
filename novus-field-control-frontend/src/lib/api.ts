import { CONTROL_API_URL } from "./config";
import { clearAuthState, readAuthState, writeAuthState } from "./storage";
import type {
  AuthResponse,
  AuthUser,
  BillingInvoice,
  BillingInvoicePayload,
  BillingInvoicesResponse,
  BillingInvoiceStatus,
  DashboardSummary,
  ProvisioningProject,
  ProvisioningProjectListResponse,
  ProvisioningProjectPayload,
  ProvisioningProjectStatus,
  Tenant,
  TenantBillingProfilePayload,
  TenantBillingResponse,
  TenantListResponse,
  TenantOptionsResponse,
  TenantPayload,
  TenantStatus,
} from "@/types";

// Requisicoes concorrentes que recebem 401 ao mesmo tempo precisam compartilhar
// uma unica renovacao: o backend rotaciona o refresh token, entao a segunda
// chamada usaria um token ja invalidado e derrubaria a sessao do usuario.
let pendingRefresh: Promise<AuthResponse | null> | null = null;

function refreshOnce(refreshToken: string): Promise<AuthResponse | null> {
  if (!pendingRefresh) {
    pendingRefresh = refreshSession(refreshToken)
      .catch(() => null)
      .finally(() => {
        pendingRefresh = null;
      });
  }

  return pendingRefresh;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const auth = readAuthState();
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth?.accessToken) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }

  const response = await fetch(`${CONTROL_API_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && retry && path !== "/auth/refresh") {
    const current = readAuthState();

    // Outra requisicao ja renovou a sessao enquanto esta estava em voo.
    if (current?.accessToken && current.accessToken !== auth?.accessToken) {
      return request<T>(path, init, false);
    }

    if (current?.refreshToken) {
      const refreshed = await refreshOnce(current.refreshToken);
      if (refreshed) {
        return request<T>(path, init, false);
      }
    }

    clearAuthState();
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthState();
    }
    const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message)
      ? payload?.message.join(", ")
      : payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const data = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  writeAuthState(data);
  return data;
}

export async function refreshSession(refreshToken: string) {
  const data = await request<AuthResponse>(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
    false,
  );
  writeAuthState(data);
  return data;
}

export async function logout() {
  const auth = readAuthState();
  if (auth?.refreshToken) {
    await request(
      "/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      },
      false,
    ).catch(() => undefined);
  }

  writeAuthState(null);
}

export function getStoredUser(): AuthUser | null {
  return readAuthState()?.user ?? null;
}

export async function getCurrentUser() {
  const user = await request<AuthUser>("/auth/me");
  const state = readAuthState();
  if (state) {
    writeAuthState({ ...state, user });
  }
  return user;
}

interface PageParams {
  page?: number;
  pageSize?: number;
}

function appendPageParams(params: URLSearchParams, filters: PageParams) {
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }
}

export async function listTenants(filters: { search?: string; status?: TenantStatus | "all" } & PageParams) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  appendPageParams(params, filters);
  const query = params.toString();
  return request<TenantListResponse>(`/tenants${query ? `?${query}` : ""}`);
}

/** Lista enxuta e completa, para popular selects de tenant. */
export function listTenantOptions() {
  return request<TenantOptionsResponse>("/tenants/options");
}

export function getDashboardSummary() {
  return request<DashboardSummary>("/dashboard/summary");
}

export function getTenant(id: string) {
  return request<Tenant>(`/tenants/${id}`);
}

export function createTenant(payload: TenantPayload) {
  return request<Tenant>("/tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTenant(id: string, payload: Partial<TenantPayload>) {
  return request<Tenant>(`/tenants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTenant(id: string) {
  return request<{ success: true }>(`/tenants/${id}`, {
    method: "DELETE",
  });
}

export async function listProvisioningProjects(filters: {
  search?: string;
  status?: ProvisioningProjectStatus | "all";
  tenantId?: string;
} & PageParams) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.tenantId?.trim()) {
    params.set("tenantId", filters.tenantId.trim());
  }
  appendPageParams(params, filters);
  const query = params.toString();
  return request<ProvisioningProjectListResponse>(`/provisioning-projects${query ? `?${query}` : ""}`);
}

export function getProvisioningProject(id: string) {
  return request<ProvisioningProject>(`/provisioning-projects/${id}`);
}

export function createProvisioningProject(payload: ProvisioningProjectPayload) {
  return request<ProvisioningProject>("/provisioning-projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProvisioningProject(id: string, payload: Partial<ProvisioningProjectPayload>) {
  return request<ProvisioningProject>(`/provisioning-projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listBillingInvoices(filters: {
  search?: string;
  status?: BillingInvoiceStatus | "all";
  tenantId?: string;
} & PageParams) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.tenantId?.trim()) {
    params.set("tenantId", filters.tenantId.trim());
  }
  appendPageParams(params, filters);
  const query = params.toString();
  return request<BillingInvoicesResponse>(`/billing/invoices${query ? `?${query}` : ""}`);
}

export function createBillingInvoice(payload: BillingInvoicePayload) {
  return request<BillingInvoice>("/billing/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBillingInvoice(id: string, payload: Partial<BillingInvoicePayload>) {
  return request<BillingInvoice>(`/billing/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getTenantBilling(tenantId: string) {
  return request<TenantBillingResponse>(`/billing/tenants/${tenantId}`);
}

export function updateTenantBillingProfile(tenantId: string, payload: TenantBillingProfilePayload) {
  return request(`/billing/tenants/${tenantId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
