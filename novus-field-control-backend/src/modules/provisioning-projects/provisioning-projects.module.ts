import { Module } from "@nestjs/common";
import { ProvisioningProjectsController } from "./provisioning-projects.controller";
import { ProvisioningProjectsService } from "./provisioning-projects.service";

@Module({
  controllers: [ProvisioningProjectsController],
  providers: [ProvisioningProjectsService],
  exports: [ProvisioningProjectsService],
})
export class ProvisioningProjectsModule {}
