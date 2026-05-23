import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ResolveTenantDto } from "./dto/resolve-tenant.dto";
import { TenantResolverService } from "./tenant-resolver.service";

@ApiTags("tenant-resolver")
@Controller("tenant-resolver")
export class TenantResolverController {
  constructor(private readonly tenantResolverService: TenantResolverService) {}

  @Post("resolve")
  @HttpCode(200)
  resolve(@Body() dto: ResolveTenantDto) {
    return this.tenantResolverService.resolve(dto);
  }
}
