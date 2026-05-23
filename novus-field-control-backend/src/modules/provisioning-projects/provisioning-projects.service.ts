import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProvisioningProjectStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProvisioningProjectDto } from "./dto/create-provisioning-project.dto";
import { ListProvisioningProjectsQueryDto } from "./dto/list-provisioning-projects-query.dto";
import { UpdateProvisioningProjectDto } from "./dto/update-provisioning-project.dto";

@Injectable()
export class ProvisioningProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProvisioningProjectsQueryDto) {
    const where: Prisma.ProvisioningProjectWhereInput = {};

    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { name: { contains: value, mode: "insensitive" } },
        { description: { contains: value, mode: "insensitive" } },
        { ownerName: { contains: value, mode: "insensitive" } },
        { tenant: { displayName: { contains: value, mode: "insensitive" } } },
        { tenant: { slug: { contains: value, mode: "insensitive" } } },
      ];
    }

    const [items, total, planned, active, blocked, completed] = await Promise.all([
      this.prisma.provisioningProject.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              displayName: true,
              status: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      this.prisma.provisioningProject.count({ where }),
      this.prisma.provisioningProject.count({ where: { ...where, status: ProvisioningProjectStatus.planned } }),
      this.prisma.provisioningProject.count({ where: { ...where, status: ProvisioningProjectStatus.active } }),
      this.prisma.provisioningProject.count({ where: { ...where, status: ProvisioningProjectStatus.blocked } }),
      this.prisma.provisioningProject.count({ where: { ...where, status: ProvisioningProjectStatus.completed } }),
    ]);

    return {
      items,
      total,
      summary: {
        total,
        planned,
        active,
        blocked,
        completed,
      },
    };
  }

  async create(dto: CreateProvisioningProjectDto) {
    await this.ensureTenant(dto.tenantId);
    return this.prisma.provisioningProject.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        ownerName: dto.ownerName?.trim() || null,
        status: dto.status,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
        targetGoLiveAt: dto.targetGoLiveAt ? new Date(dto.targetGoLiveAt) : null,
      },
      include: {
        tenant: {
          select: { id: true, slug: true, displayName: true, status: true },
        },
      },
    });
  }

  async getById(id: string) {
    const project = await this.prisma.provisioningProject.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, slug: true, displayName: true, status: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException("Provisioning project not found");
    }

    return project;
  }

  async update(id: string, dto: UpdateProvisioningProjectDto) {
    await this.getById(id);

    if (dto.tenantId) {
      await this.ensureTenant(dto.tenantId);
    }

    return this.prisma.provisioningProject.update({
      where: { id },
      data: {
        ...(dto.tenantId ? { tenantId: dto.tenantId } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.ownerName !== undefined ? { ownerName: dto.ownerName?.trim() || null } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.startedAt !== undefined ? { startedAt: dto.startedAt ? new Date(dto.startedAt) : null } : {}),
        ...(dto.targetGoLiveAt !== undefined
          ? { targetGoLiveAt: dto.targetGoLiveAt ? new Date(dto.targetGoLiveAt) : null }
          : {}),
      },
      include: {
        tenant: {
          select: { id: true, slug: true, displayName: true, status: true },
        },
      },
    });
  }

  private async ensureTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) {
      throw new ConflictException("Tenant not found for provisioning project");
    }
  }
}
