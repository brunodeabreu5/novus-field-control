import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BillingInvoiceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBillingInvoiceDto } from "./dto/create-billing-invoice.dto";
import { ListBillingInvoicesQueryDto } from "./dto/list-billing-invoices-query.dto";
import { UpdateBillingInvoiceDto } from "./dto/update-billing-invoice.dto";
import { UpdateTenantBillingProfileDto } from "./dto/update-tenant-billing-profile.dto";

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async listInvoices(query: ListBillingInvoicesQueryDto) {
    const where: Prisma.BillingInvoiceWhereInput = {};

    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { number: { contains: value, mode: "insensitive" } },
        { description: { contains: value, mode: "insensitive" } },
        { tenant: { displayName: { contains: value, mode: "insensitive" } } },
        { tenant: { slug: { contains: value, mode: "insensitive" } } },
      ];
    }

    const [items, total, paid, issued, overdue, draft] = await Promise.all([
      this.prisma.billingInvoice.findMany({
        where,
        include: {
          tenant: {
            select: { id: true, slug: true, displayName: true, status: true },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      }),
      this.prisma.billingInvoice.count({ where }),
      this.prisma.billingInvoice.count({ where: { ...where, status: BillingInvoiceStatus.paid } }),
      this.prisma.billingInvoice.count({ where: { ...where, status: BillingInvoiceStatus.issued } }),
      this.prisma.billingInvoice.count({ where: { ...where, status: BillingInvoiceStatus.overdue } }),
      this.prisma.billingInvoice.count({ where: { ...where, status: BillingInvoiceStatus.draft } }),
    ]);

    return {
      items,
      total,
      summary: {
        total,
        paid,
        issued,
        overdue,
        draft,
      },
    };
  }

  async createInvoice(dto: CreateBillingInvoiceDto) {
    const profile = await this.ensureTenantProfile(dto.tenantId);

    return this.prisma.billingInvoice.create({
      data: {
        tenantId: dto.tenantId,
        billingProfileId: profile.id,
        number: dto.number.trim().toUpperCase(),
        amount: dto.amount,
        currency: dto.currency,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        status: dto.status,
        description: dto.description?.trim() || null,
      },
      include: {
        tenant: { select: { id: true, slug: true, displayName: true, status: true } },
      },
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Invoice number already in use");
      }
      throw error;
    });
  }

  async updateInvoice(id: string, dto: UpdateBillingInvoiceDto) {
    await this.ensureInvoice(id);

    if (dto.tenantId) {
      await this.ensureTenantProfile(dto.tenantId);
    }

    return this.prisma.billingInvoice.update({
      where: { id },
      data: {
        ...(dto.tenantId ? { tenantId: dto.tenantId } : {}),
        ...(dto.number ? { number: dto.number.trim().toUpperCase() } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.issueDate ? { issueDate: new Date(dto.issueDate) } : {}),
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
      },
      include: {
        tenant: { select: { id: true, slug: true, displayName: true, status: true } },
      },
    });
  }

  async getTenantBilling(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, displayName: true, status: true },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const profile = await this.ensureTenantProfile(tenantId);
    const invoices = await this.prisma.billingInvoice.findMany({
      where: { tenantId },
      orderBy: [{ dueDate: "desc" }],
      include: {
        tenant: { select: { id: true, slug: true, displayName: true, status: true } },
      },
    });

    const totalOutstanding = invoices
      .filter((invoice) => invoice.status === BillingInvoiceStatus.issued || invoice.status === BillingInvoiceStatus.overdue)
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const totalPaid = invoices
      .filter((invoice) => invoice.status === BillingInvoiceStatus.paid)
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return {
      tenant,
      profile,
      invoices,
      summary: {
        invoiceCount: invoices.length,
        totalOutstanding,
        totalPaid,
        overdueCount: invoices.filter((invoice) => invoice.status === BillingInvoiceStatus.overdue).length,
      },
    };
  }

  async updateTenantProfile(tenantId: string, dto: UpdateTenantBillingProfileDto) {
    await this.ensureTenant(tenantId);

    return this.prisma.tenantBillingProfile.upsert({
      where: { tenantId },
      create: {
        tenantId,
        plan: dto.plan ?? undefined,
        currency: dto.currency ?? undefined,
        monthlyAmount: dto.monthlyAmount ?? 0,
        status: dto.status ?? undefined,
        notes: dto.notes?.trim() || null,
      },
      update: {
        ...(dto.plan ? { plan: dto.plan } : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.monthlyAmount !== undefined ? { monthlyAmount: dto.monthlyAmount } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
      },
    });
  }

  private async ensureTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }
    return tenant;
  }

  private async ensureTenantProfile(tenantId: string) {
    await this.ensureTenant(tenantId);

    return this.prisma.tenantBillingProfile.upsert({
      where: { tenantId },
      create: {
        tenantId,
      },
      update: {},
    });
  }

  private async ensureInvoice(id: string) {
    const invoice = await this.prisma.billingInvoice.findUnique({ where: { id }, select: { id: true } });
    if (!invoice) {
      throw new NotFoundException("Billing invoice not found");
    }
    return invoice;
  }
}

