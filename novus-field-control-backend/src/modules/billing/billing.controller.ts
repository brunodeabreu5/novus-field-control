import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { BillingService } from "./billing.service";
import { CreateBillingInvoiceDto } from "./dto/create-billing-invoice.dto";
import { ListBillingInvoicesQueryDto } from "./dto/list-billing-invoices-query.dto";
import { UpdateBillingInvoiceDto } from "./dto/update-billing-invoice.dto";
import { UpdateTenantBillingProfileDto } from "./dto/update-tenant-billing-profile.dto";
import { AdminRole } from "@prisma/client";

@ApiTags("billing")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("invoices")
  listInvoices(@Query() query: ListBillingInvoicesQueryDto) {
    return this.billingService.listInvoices(query);
  }

  @Post("invoices")
  createInvoice(@Body() dto: CreateBillingInvoiceDto) {
    return this.billingService.createInvoice(dto);
  }

  @Patch("invoices/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.owner, AdminRole.admin)
  updateInvoice(@Param("id") id: string, @Body() dto: UpdateBillingInvoiceDto) {
    return this.billingService.updateInvoice(id, dto);
  }

  @Get("tenants/:tenantId")
  getTenantBilling(@Param("tenantId") tenantId: string) {
    return this.billingService.getTenantBilling(tenantId);
  }

  @Patch("tenants/:tenantId/profile")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.owner, AdminRole.admin)
  updateTenantProfile(@Param("tenantId") tenantId: string, @Body() dto: UpdateTenantBillingProfileDto) {
    return this.billingService.updateTenantProfile(tenantId, dto);
  }
}
