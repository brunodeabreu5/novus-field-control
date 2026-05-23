export const CONTROL_API_URL =
  (import.meta.env.VITE_CONTROL_API_URL as string | undefined)?.trim() ||
  "http://localhost:4010/api";
