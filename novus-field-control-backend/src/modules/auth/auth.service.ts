import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AdminRole } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { CookieOptions, Request, Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { AuthenticatedUser } from "./interfaces/authenticated-user.interface";
import { env } from "../../config/env";

/**
 * O refresh token nunca chega ao JavaScript do navegador: sai em cookie
 * httpOnly, restrito as rotas de autenticacao. E o que impede um XSS de roubar
 * uma sessao de 30 dias — o access token, que fica em memoria, some ao recarregar.
 */
export const REFRESH_COOKIE = "nfc_refresh";
const REFRESH_COOKIE_PATH = "/api/auth";
const REFRESH_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, request: Request, response: Response) {
    const email = dto.email.trim().toLowerCase();
    const admin = await this.prisma.controlAdmin.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.prisma.controlAdmin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const refreshToken = this.generateRefreshToken();
    const session = await this.prisma.controlSession.create({
      data: {
        adminId: admin.id,
        refreshToken,
        expiresAt: this.getRefreshTokenExpiry(),
        userAgent: this.getUserAgent(request),
        ipAddress: this.getIpAddress(request),
      },
      select: { id: true },
    });

    return this.buildAuthResponse(
      {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      refreshToken,
      session.id,
      response,
    );
  }

  async refresh(request: Request, response: Response) {
    const presented = this.readRefreshCookie(request);
    if (!presented) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.prisma.controlSession.findUnique({
      where: { refreshToken: presented },
      include: { admin: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      this.clearRefreshCookie(response);
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (!session.admin.isActive) {
      this.clearRefreshCookie(response);
      throw new UnauthorizedException("User is inactive");
    }

    const nextRefreshToken = this.generateRefreshToken();
    await this.prisma.controlSession.update({
      where: { id: session.id },
      data: {
        refreshToken: nextRefreshToken,
        expiresAt: this.getRefreshTokenExpiry(),
        revokedAt: null,
        userAgent: this.getUserAgent(request),
        ipAddress: this.getIpAddress(request),
      },
    });

    return this.buildAuthResponse(
      {
        id: session.admin.id,
        email: session.admin.email,
        fullName: session.admin.fullName,
        role: session.admin.role,
        isActive: session.admin.isActive,
        lastLoginAt: session.admin.lastLoginAt,
        createdAt: session.admin.createdAt,
        updatedAt: session.admin.updatedAt,
      },
      nextRefreshToken,
      session.id,
      response,
    );
  }

  async logout(user: AuthenticatedUser, request: Request, response: Response) {
    // Revoga a sessao do proprio token em uso; o cookie e apenas o transporte.
    await this.prisma.controlSession.updateMany({
      where: { id: user.sid, adminId: user.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.clearRefreshCookie(response);
    return { success: true };
  }

  async logoutAll(user: AuthenticatedUser, response: Response) {
    await this.prisma.controlSession.updateMany({
      where: { adminId: user.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.clearRefreshCookie(response);
    return { success: true };
  }

  async me(userId: string) {
    const admin = await this.prisma.controlAdmin.findUnique({
      where: { id: userId },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException("User not found");
    }

    return this.serializeAdmin(admin);
  }

  private buildAuthResponse(
    admin: {
      id: string;
      email: string;
      fullName: string | null;
      role: AdminRole;
      isActive: boolean;
      lastLoginAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    refreshToken: string,
    sessionId: string,
    response: Response,
  ) {
    const accessToken = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      sid: sessionId,
    } satisfies AuthenticatedUser);

    this.setRefreshCookie(response, refreshToken);

    // O refresh token nao aparece no corpo de proposito: se aparecesse, o
    // cliente poderia guarda-lo e o cookie httpOnly perderia o proposito.
    return {
      accessToken,
      user: this.serializeAdmin(admin),
    };
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: env.cookie.secure,
      sameSite: env.cookie.sameSite,
      domain: env.cookie.domain,
      path: REFRESH_COOKIE_PATH,
    };
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_COOKIE, refreshToken, {
      ...this.cookieOptions(),
      maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  private readRefreshCookie(request: Request) {
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.[REFRESH_COOKIE] || null;
  }

  private serializeAdmin(admin: {
    id: string;
    email: string;
    fullName: string | null;
    role: AdminRole;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  private generateRefreshToken() {
    return randomBytes(48).toString("base64url");
  }

  private getRefreshTokenExpiry() {
    const result = new Date();
    result.setDate(result.getDate() + REFRESH_TTL_DAYS);
    return result;
  }

  private getUserAgent(request: Request) {
    const value = request.headers["user-agent"];
    return typeof value === "string" ? value : null;
  }

  private getIpAddress(request: Request) {
    const forwardedFor = request.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
      return forwardedFor.split(",")[0]?.trim() || null;
    }

    return request.ip || null;
  }
}
