import { SetMetadata } from "@nestjs/common";
import { AdminRole } from "@prisma/client";

export const ROLES_KEY = "roles";

/** Restringe o handler aos papeis informados. */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Libera o handler para qualquer papel autenticado. Necessario em rotas que
 * alteram estado mas nao sao privilegiadas — o logout, por exemplo, que todo
 * usuario precisa conseguir fazer.
 */
export const AnyRole = () =>
  SetMetadata(ROLES_KEY, [AdminRole.owner, AdminRole.admin, AdminRole.support]);
