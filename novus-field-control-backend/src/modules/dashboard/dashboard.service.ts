import { Injectable } from "@nestjs/common";
import {
  BillingInvoiceStatus,
  BillingProfileStatus,
  Currency,
  Prisma,
  ProvisioningProjectStatus,
  TenantStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const RECENT_LIMIT = 5;
const CHART_MONTHS = 6;

export interface MonthlyRevenueRow {
  month: string;
  currency: Currency;
  total: Prisma.Decimal;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * O painel resume a base inteira. Antes esses numeros eram calculados no
   * cliente a partir das listagens completas, o que deixou de ser possivel
   * quando elas passaram a ser paginadas — e nao escalava de qualquer forma.
   */
  async summary() {
    const [
      activeTenants,
      totalTenants,
      blockedProjects,
      overdueInvoices,
      revenueRows,
      recentTenants,
      priorityProjects,
      issuedByMonth,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { status: TenantStatus.active } }),
      this.prisma.tenant.count(),
      this.prisma.provisioningProject.count({ where: { status: ProvisioningProjectStatus.blocked } }),
      this.prisma.billingInvoice.count({ where: { status: BillingInvoiceStatus.overdue } }),
      this.prisma.tenantBillingProfile.groupBy({
        by: ["currency"],
        where: { status: { not: BillingProfileStatus.canceled } },
        _sum: { monthlyAmount: true },
      }),
      this.prisma.tenant.findMany({
        take: RECENT_LIMIT,
        orderBy: { createdAt: "desc" },
        select: { id: true, slug: true, displayName: true, status: true, createdAt: true },
      }),
      this.prisma.provisioningProject.findMany({
        where: { status: { not: ProvisioningProjectStatus.completed } },
        take: RECENT_LIMIT,
        orderBy: { updatedAt: "asc" },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          tenant: { select: { id: true, slug: true, displayName: true } },
        },
      }),
      this.issuedRevenueByMonth(),
    ]);

    return {
      metrics: {
        activeTenants,
        totalTenants,
        blockedProjects,
        overdueInvoices,
        monthlyRevenueByCurrency: revenueRows.map((row) => ({
          currency: row.currency,
          total: row._sum.monthlyAmount ?? new Prisma.Decimal(0),
        })),
      },
      issuedByMonth,
      recentTenants,
      priorityProjects,
    };
  }

  /**
   * Ultimos meses que efetivamente tem faturas — nao os ultimos meses do
   * calendario. Preserva o comportamento anterior do grafico, que agrupava tudo
   * e ficava com os 6 ultimos baldes existentes.
   */
  private issuedRevenueByMonth() {
    return this.prisma.$queryRaw<MonthlyRevenueRow[]>`
      SELECT to_char(bucket, 'MM/YYYY') AS month,
             currency,
             total
      FROM (
        SELECT date_trunc('month', issue_date) AS bucket,
               currency,
               SUM(amount) AS total
        FROM billing_invoices
        GROUP BY bucket, currency
      ) grouped
      WHERE bucket IN (
        SELECT DISTINCT date_trunc('month', issue_date)
        FROM billing_invoices
        ORDER BY 1 DESC
        LIMIT ${CHART_MONTHS}
      )
      ORDER BY bucket ASC
    `;
  }
}
