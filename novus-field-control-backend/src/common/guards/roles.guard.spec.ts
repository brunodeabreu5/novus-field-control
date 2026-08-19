import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminRole } from "@prisma/client";
import { RolesGuard } from "./roles.guard";
import { AuthenticatedUser } from "../../modules/auth/interfaces/authenticated-user.interface";

function contextFor(method: string, user?: Partial<AuthenticatedUser>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ method, user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardWith(explicitRoles?: AdminRole[]) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(explicitRoles) } as unknown as Reflector;
  return new RolesGuard(reflector);
}

const support = { role: AdminRole.support };
const admin = { role: AdminRole.admin };
const owner = { role: AdminRole.owner };

describe("RolesGuard", () => {
  describe("sem anotacao explicita", () => {
    it.each(["GET", "HEAD", "OPTIONS"])("permite leitura (%s) a qualquer papel", (method) => {
      expect(guardWith().canActivate(contextFor(method, support))).toBe(true);
    });

    it.each(["POST", "PATCH", "PUT", "DELETE"])("bloqueia support em %s", (method) => {
      expect(() => guardWith().canActivate(contextFor(method, support))).toThrow(ForbiddenException);
    });

    it.each(["POST", "PATCH", "DELETE"])("permite admin e owner em %s", (method) => {
      expect(guardWith().canActivate(contextFor(method, admin))).toBe(true);
      expect(guardWith().canActivate(contextFor(method, owner))).toBe(true);
    });
  });

  describe("com anotacao explicita", () => {
    it("respeita a lista informada mesmo em escrita", () => {
      const guard = guardWith([AdminRole.owner, AdminRole.admin, AdminRole.support]);
      expect(guard.canActivate(contextFor("POST", support))).toBe(true);
    });

    it("pode ser mais restritiva que o padrao", () => {
      const guard = guardWith([AdminRole.owner]);
      expect(() => guard.canActivate(contextFor("DELETE", admin))).toThrow(ForbiddenException);
    });
  });

  it("ignora requisicoes sem usuario — autenticacao e do JwtAuthGuard", () => {
    expect(guardWith().canActivate(contextFor("POST", undefined))).toBe(true);
  });
});
