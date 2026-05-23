import { Module } from "@nestjs/common";
import { TenantResolverController } from "./tenant-resolver.controller";
import { TenantResolverService } from "./tenant-resolver.service";

@Module({
  controllers: [TenantResolverController],
  providers: [TenantResolverService],
})
export class TenantResolverModule {}
