import { PartialType } from "@nestjs/swagger";
import { CreateProvisioningProjectDto } from "./create-provisioning-project.dto";

export class UpdateProvisioningProjectDto extends PartialType(CreateProvisioningProjectDto) {}
