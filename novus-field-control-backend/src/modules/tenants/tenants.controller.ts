import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { ListTenantsQueryDto } from "./dto/list-tenants-query.dto";
import { TenantsService } from "./tenants.service";

@ApiTags("tenants")
@ApiBearerAuth()
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  list(@Query() query: ListTenantsQueryDto) {
    return this.tenantsService.list(query);
  }

  // Precisa vir antes de @Get(":id"), senao "options" seria capturado como id.
  @Get("options")
  options() {
    return this.tenantsService.options();
  }

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.tenantsService.getById(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tenantsService.remove(id);
  }
}
