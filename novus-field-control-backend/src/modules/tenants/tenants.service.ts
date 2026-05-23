import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BillingPlan, BillingProfileStatus, Currency, Prisma, TenantStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { ListTenantsQueryDto } from "./dto/list-tenants-query.dto";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeBaseDomain(value?: string | null) {
    if (!value) return undefined;

    return value
      .trim()
      .replace(/\/+$/, "")
      .toLowerCase();
  }

  private resolveBaseOrigin(baseDomain: string) {
    if (/^https?:\/\//i.test(baseDomain)) {
      return baseDomain;
    }

    return `https://${baseDomain}`;
  }

  private buildDefaultEndpoints(baseDomain: string) {
    const origin = this.resolveBaseOrigin(baseDomain);

    return {
      apiBaseUrl: `${origin}/api`,
      wsBaseUrl: origin,
      webBaseUrl: origin,
      assetsBaseUrl: origin,
    };
  }

  async list(query: ListTenantsQueryDto) {
    const where: Prisma.TenantWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { displayName: { contains: value, mode: "insensitive" } },
        { slug: { contains: value, mode: "insensitive" } },
        { companyCode: { contains: value, mode: "insensitive" } },
        { baseDomain: { contains: value, mode: "insensitive" } },
      ];
    }

    const [items, total, active, inactive, suspended, provisioning] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          billingProfile: true,
          _count: {
            select: {
              provisioningProjects: true,
              billingInvoices: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      this.prisma.tenant.count({ where }),
      this.prisma.tenant.count({ where: { status: TenantStatus.active } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.inactive } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.suspended } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.provisioning } }),
    ]);

    return {
      items,
      total,
      summary: {
        total: active + inactive + suspended + provisioning,
        active,
        inactive,
        suspended,
        provisioning,
      },
    };
  }

  async create(dto: CreateTenantDto) {
    return this.persist(dto);
  }

  async getById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        billingProfile: true,
        _count: {
          select: {
            provisioningProjects: true,
            billingInvoices: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const current = await this.getById(id);
    return this.persist(dto, id, current);
  }

  async remove(id: string) {
    await this.getById(id);

    try {
      await this.prisma.tenant.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BadRequestException("Tenant cannot be deleted because it still has related records.");
      }

      throw error;
    }

    return { success: true };
  }

  private async persist(dto: Partial<CreateTenantDto>, tenantId?: string, current?: Awaited<ReturnType<TenantsService["getById"]>>) {
    const normalized = {
      slug: dto.slug?.trim().toLowerCase(),
      companyCode: dto.companyCode?.trim().toUpperCase() || null,
      displayName: dto.displayName?.trim(),
      baseDomain: this.normalizeBaseDomain(dto.baseDomain),
      apiBaseUrl: dto.apiBaseUrl?.trim(),
      wsBaseUrl: dto.wsBaseUrl?.trim(),
      webBaseUrl: dto.webBaseUrl?.trim(),
      assetsBaseUrl: dto.assetsBaseUrl?.trim() || null,
      status: dto.status,
    };

    if (normalized.slug) {
      const slugConflict = await this.prisma.tenant.findFirst({
        where: {
          slug: normalized.slug,
          NOT: tenantId ? { id: tenantId } : undefined,
        },
        select: { id: true },
      });

      if (slugConflict) {
        throw new ConflictException("Slug already in use");
      }
    }

    if (normalized.companyCode) {
      const codeConflict = await this.prisma.tenant.findFirst({
        where: {
          companyCode: normalized.companyCode,
          NOT: tenantId ? { id: tenantId } : undefined,
        },
        select: { id: true },
      });

      if (codeConflict) {
        throw new ConflictException("Company code already in use");
      }
    }

    const effectiveBaseDomain = normalized.baseDomain || current?.baseDomain;
    const derivedEndpoints = effectiveBaseDomain
      ? this.buildDefaultEndpoints(effectiveBaseDomain)
      : null;

    const resolvedEndpoints = {
      apiBaseUrl: normalized.apiBaseUrl || derivedEndpoints?.apiBaseUrl,
      wsBaseUrl: normalized.wsBaseUrl || derivedEndpoints?.wsBaseUrl,
      webBaseUrl: normalized.webBaseUrl || derivedEndpoints?.webBaseUrl,
      assetsBaseUrl:
        dto.assetsBaseUrl !== undefined
          ? normalized.assetsBaseUrl
          : (derivedEndpoints?.assetsBaseUrl ?? current?.assetsBaseUrl ?? null),
    };

    if (!tenantId) {
      return this.prisma.tenant.create({
        data: {
          slug: normalized.slug!,
          companyCode: normalized.companyCode,
          displayName: normalized.displayName!,
          status: normalized.status!,
          baseDomain: normalized.baseDomain!,
          apiBaseUrl: resolvedEndpoints.apiBaseUrl!,
          wsBaseUrl: resolvedEndpoints.wsBaseUrl!,
          webBaseUrl: resolvedEndpoints.webBaseUrl!,
          assetsBaseUrl: resolvedEndpoints.assetsBaseUrl,
          billingProfile: {
            create: {
              plan: BillingPlan.starter,
              currency: Currency.PYG,
              monthlyAmount: 0,
              status: BillingProfileStatus.active,
            },
          },
        },
        include: {
          billingProfile: true,
          _count: {
            select: {
              provisioningProjects: true,
              billingInvoices: true,
            },
          },
        },
      });
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(normalized.slug ? { slug: normalized.slug } : {}),
        ...(dto.companyCode !== undefined ? { companyCode: normalized.companyCode } : {}),
        ...(normalized.displayName ? { displayName: normalized.displayName } : {}),
        ...(normalized.status ? { status: normalized.status } : {}),
        ...(normalized.baseDomain ? { baseDomain: normalized.baseDomain } : {}),
        ...(resolvedEndpoints.apiBaseUrl ? { apiBaseUrl: resolvedEndpoints.apiBaseUrl } : {}),
        ...(resolvedEndpoints.wsBaseUrl ? { wsBaseUrl: resolvedEndpoints.wsBaseUrl } : {}),
        ...(resolvedEndpoints.webBaseUrl ? { webBaseUrl: resolvedEndpoints.webBaseUrl } : {}),
        ...((dto.assetsBaseUrl !== undefined || normalized.baseDomain)
          ? { assetsBaseUrl: resolvedEndpoints.assetsBaseUrl }
          : {}),
      },
      include: {
        billingProfile: true,
        _count: {
          select: {
            provisioningProjects: true,
            billingInvoices: true,
          },
        },
      },
    });
  }
}
