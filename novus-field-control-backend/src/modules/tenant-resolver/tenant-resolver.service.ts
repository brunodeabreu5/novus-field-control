import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { TenantStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ResolveTenantDto } from "./dto/resolve-tenant.dto";

@Injectable()
export class TenantResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(dto: ResolveTenantDto) {
    const slug = dto.slug?.trim().toLowerCase();
    const companyCode = dto.companyCode?.trim().toUpperCase();

    if (!slug && !companyCode) {
      throw new UnprocessableEntityException("Provide slug or companyCode");
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          ...(slug ? [{ slug }] : []),
          ...(companyCode ? [{ companyCode }] : []),
        ],
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    if (tenant.status !== TenantStatus.active) {
      throw new UnprocessableEntityException("Tenant is not active");
    }

    return {
      tenantId: tenant.id,
      slug: tenant.slug,
      companyCode: tenant.companyCode,
      displayName: tenant.displayName,
      status: tenant.status,
      baseDomain: tenant.baseDomain,
      apiBaseUrl: tenant.apiBaseUrl,
      wsBaseUrl: tenant.wsBaseUrl,
      webBaseUrl: tenant.webBaseUrl,
      assetsBaseUrl: tenant.assetsBaseUrl,
    };
  }
}
