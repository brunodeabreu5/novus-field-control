import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthenticatedUser } from "../../modules/auth/interfaces/authenticated-user.interface";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Papeis exigidos por padrao para qualquer rota que altere estado. */
const MUTATION_ROLES: AdminRole[] = [AdminRole.owner, AdminRole.admin];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser; method: string }>();
    const user = request.user;

    // Rotas publicas (login, refresh, resolver de tenant, health) nao tem
    // usuario. Autenticacao e responsabilidade do JwtAuthGuard, nao deste guard.
    if (!user) {
      return true;
    }

    const explicitRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (explicitRoles?.length) {
      return this.assertRole(user, explicitRoles);
    }

    // Sem anotacao, leitura e livre e escrita exige owner|admin. O padrao e
    // negar de proposito: assim um endpoint novo nasce protegido. O contrario
    // — exigir que cada rota lembre de se anotar — foi como o papel `support`
    // acabou podendo criar empresas, emitir faturas e editar projetos.
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    return this.assertRole(user, MUTATION_ROLES);
  }

  private assertRole(user: AuthenticatedUser, requiredRoles: AdminRole[]) {
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(", ")}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
