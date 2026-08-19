import { UnauthorizedException } from "@nestjs/common";
import { AdminRole } from "@prisma/client";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuthenticatedUser } from "../interfaces/authenticated-user.interface";

const PAYLOAD: AuthenticatedUser = {
  sub: "admin-1",
  email: "admin@novusfield.com",
  role: AdminRole.owner,
  sid: "session-1",
};

function buildStrategy(session: unknown) {
  const prisma = {
    controlSession: { findUnique: jest.fn().mockResolvedValue(session) },
  } as unknown as PrismaService;

  return { strategy: new JwtStrategy(prisma), prisma };
}

function activeSession(overrides: Record<string, unknown> = {}) {
  return {
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    admin: {
      id: "admin-1",
      email: "admin@novusfield.com",
      role: AdminRole.owner,
      isActive: true,
    },
    ...overrides,
  };
}

describe("JwtStrategy.validate", () => {
  it("aceita token de sessao ativa", async () => {
    const { strategy } = buildStrategy(activeSession());
    await expect(strategy.validate(PAYLOAD)).resolves.toEqual(PAYLOAD);
  });

  it("recusa token sem sid (formato anterior a sessao vinculada)", async () => {
    const { strategy, prisma } = buildStrategy(activeSession());
    const semSid = { ...PAYLOAD, sid: undefined } as unknown as AuthenticatedUser;

    await expect(strategy.validate(semSid)).rejects.toThrow(UnauthorizedException);
    expect(prisma.controlSession.findUnique).not.toHaveBeenCalled();
  });

  it("recusa sessao revogada — e o que faz o logout valer na hora", async () => {
    const { strategy } = buildStrategy(activeSession({ revokedAt: new Date() }));
    await expect(strategy.validate(PAYLOAD)).rejects.toThrow(UnauthorizedException);
  });

  it("recusa sessao expirada", async () => {
    const { strategy } = buildStrategy(activeSession({ expiresAt: new Date(Date.now() - 1000) }));
    await expect(strategy.validate(PAYLOAD)).rejects.toThrow(UnauthorizedException);
  });

  it("recusa sessao inexistente", async () => {
    const { strategy } = buildStrategy(null);
    await expect(strategy.validate(PAYLOAD)).rejects.toThrow(UnauthorizedException);
  });

  it("recusa admin desativado", async () => {
    const { strategy } = buildStrategy(
      activeSession({ admin: { id: "admin-1", email: "a@b.c", role: AdminRole.owner, isActive: false } }),
    );
    await expect(strategy.validate(PAYLOAD)).rejects.toThrow(UnauthorizedException);
  });

  it("usa o papel do banco, nao o gravado no token", async () => {
    const { strategy } = buildStrategy(
      activeSession({ admin: { id: "admin-1", email: "a@b.c", role: AdminRole.support, isActive: true } }),
    );

    await expect(strategy.validate(PAYLOAD)).resolves.toMatchObject({ role: AdminRole.support });
  });
});
