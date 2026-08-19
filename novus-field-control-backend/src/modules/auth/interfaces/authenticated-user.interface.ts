import { AdminRole } from "@prisma/client";

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: AdminRole;
  /**
   * Sessao (ControlSession) que originou o token. E o que permite revogar um
   * access token antes do vencimento: o logout marca a sessao como revogada e
   * a estrategia JWT passa a recusar os tokens emitidos por ela.
   */
  sid: string;
}
