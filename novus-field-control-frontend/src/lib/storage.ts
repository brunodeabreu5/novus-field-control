import type { AuthResponse } from "@/types";

const STORAGE_KEY = "novus_field_control_auth";

export function readAuthState(): AuthResponse | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeAuthState(value: AuthResponse | null) {
  if (!value) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearAuthState() {
  localStorage.removeItem(STORAGE_KEY);
}
