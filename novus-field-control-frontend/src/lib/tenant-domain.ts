export interface TenantEndpointPreview {
  apiBaseUrl: string;
  wsBaseUrl: string;
  webBaseUrl: string;
  assetsBaseUrl: string;
}

export function normalizeBaseDomain(value: string) {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

function resolveBaseOrigin(value: string) {
  const normalized = normalizeBaseDomain(value);
  if (!normalized) {
    return "";
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

export function buildTenantEndpoints(baseDomain: string): TenantEndpointPreview {
  const origin = resolveBaseOrigin(baseDomain);
  if (!origin) {
    return {
      apiBaseUrl: "",
      wsBaseUrl: "",
      webBaseUrl: "",
      assetsBaseUrl: "",
    };
  }

  return {
    apiBaseUrl: `${origin}/api`,
    wsBaseUrl: origin,
    webBaseUrl: origin,
    assetsBaseUrl: origin,
  };
}
