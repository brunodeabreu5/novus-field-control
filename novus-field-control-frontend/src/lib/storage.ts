import type { AuthSession } from "@/types";

/**
 * A sessao vive apenas em memoria. O access token nao e persistido de proposito:
 * em localStorage ele fica exposto a qualquer XSS, e sobreviveria ao fechamento
 * da aba. Quem sustenta a sessao entre recarregamentos e o cookie httpOnly do
 * refresh token, que o JavaScript nao consegue ler.
 */
let session: AuthSession | null = null;

export function readAuthState(): AuthSession | null {
  return session;
}

export function writeAuthState(value: AuthSession | null) {
  session = value;
}

export function clearAuthState() {
  session = null;
}
