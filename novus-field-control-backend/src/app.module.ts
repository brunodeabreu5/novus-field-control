import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { TenantResolverModule } from "./modules/tenant-resolver/tenant-resolver.module";
import { ProvisioningProjectsModule } from "./modules/provisioning-projects/provisioning-projects.module";
import { BillingModule } from "./modules/billing/billing.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
    PrismaModule,
    AuthModule,
    TenantsModule,
    TenantResolverModule,
    ProvisioningProjectsModule,
    BillingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
