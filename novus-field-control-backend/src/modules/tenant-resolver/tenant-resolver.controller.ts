import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { ResolveTenantDto } from "./dto/resolve-tenant.dto";
import { TenantResolverService } from "./tenant-resolver.service";

@ApiTags("tenant-resolver")
@Controller("tenant-resolver")
export class TenantResolverController {
  constructor(private readonly tenantResolverService: TenantResolverService) {}

  // Endpoint público consumido pelos apps na inicialização: o limite precisa
  // acomodar vários dispositivos atrás do mesmo IP (NAT de operadora) e ainda
  // assim inviabilizar enumeração de tenants em escala.
  @Public()
  @Post("resolve")
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  resolve(@Body() dto: ResolveTenantDto) {
    return this.tenantResolverService.resolve(dto);
  }
}
