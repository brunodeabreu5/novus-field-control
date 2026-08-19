import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "../../../config/env";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuthenticatedUser } from "../interfaces/authenticated-user.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwt.accessSecret,
    });
  }

  /**
   * A assinatura do token so prova que ele foi emitido por nos — nao diz se
   * ainda vale. Sem consultar o banco, um logout so teria efeito quando o token
   * vencesse (ate 8h), e desativar um admin ou mudar seu papel nao surtiria
   * efeito nenhum nesse intervalo. Por isso a sessao e o admin sao revalidados
   * a cada requisicao.
   */
  async validate(payload: AuthenticatedUser): Promise<AuthenticatedUser> {
    if (!payload?.sid) {
      throw new UnauthorizedException("Session is no longer valid");
    }

    const session = await this.prisma.controlSession.findUnique({
      where: { id: payload.sid },
      select: {
        revokedAt: true,
        expiresAt: true,
        admin: { select: { id: true, email: true, role: true, isActive: true } },
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Session is no longer valid");
    }

    if (!session.admin.isActive) {
      throw new UnauthorizedException("User is inactive");
    }

    // Papel e e-mail saem do banco, nao do token: uma mudanca de papel passa a
    // valer na requisicao seguinte.
    return {
      sub: session.admin.id,
      email: session.admin.email,
      role: session.admin.role,
      sid: payload.sid,
    };
  }
}
