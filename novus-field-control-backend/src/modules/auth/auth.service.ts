import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AdminRole } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshSessionDto } from "./dto/refresh-session.dto";
import { LogoutDto } from "./dto/logout.dto";
import { AuthenticatedUser } from "./interfaces/authenticated-user.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, request: Request) {
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
    await this.prisma.controlSession.create({
      data: {
        adminId: admin.id,
        refreshToken,
        expiresAt: this.getRefreshTokenExpiry(),
        userAgent: this.getUserAgent(request),
        ipAddress: this.getIpAddress(request),
      },
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
    );
  }

  async refresh(dto: RefreshSessionDto, request: Request) {
    const session = await this.prisma.controlSession.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { admin: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (!session.admin.isActive) {
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
    );
  }

  async logout(user: AuthenticatedUser, dto: LogoutDto) {
    if (dto.refreshToken) {
      await this.prisma.controlSession.updateMany({
        where: {
          adminId: user.sub,
          refreshToken: dto.refreshToken,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } else {
      await this.prisma.controlSession.updateMany({
        where: {
          adminId: user.sub,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

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
  ) {
    const accessToken = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    } satisfies AuthenticatedUser);

    return {
      accessToken,
      refreshToken,
      user: this.serializeAdmin(admin),
    };
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
    result.setDate(result.getDate() + 30);
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
