import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { RolesGuard } from "./common/guards/roles.guard";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { TenantResolverModule } from "./modules/tenant-resolver/tenant-resolver.module";
import { ProvisioningProjectsModule } from "./modules/provisioning-projects/provisioning-projects.module";
import { BillingModule } from "./modules/billing/billing.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";

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
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Globais de proposito, cobrindo tambem as rotas que vierem depois. A ordem
    // importa: o RolesGuard depende do usuario que o JwtAuthGuard coloca na
    // requisicao, e guards registrados por APP_GUARD rodam na ordem declarada.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
