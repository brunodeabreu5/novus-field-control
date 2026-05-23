import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateProvisioningProjectDto } from "./dto/create-provisioning-project.dto";
import { ListProvisioningProjectsQueryDto } from "./dto/list-provisioning-projects-query.dto";
import { UpdateProvisioningProjectDto } from "./dto/update-provisioning-project.dto";
import { ProvisioningProjectsService } from "./provisioning-projects.service";

@ApiTags("provisioning-projects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("provisioning-projects")
export class ProvisioningProjectsController {
  constructor(private readonly provisioningProjectsService: ProvisioningProjectsService) {}

  @Get()
  list(@Query() query: ListProvisioningProjectsQueryDto) {
    return this.provisioningProjectsService.list(query);
  }

  @Post()
  create(@Body() dto: CreateProvisioningProjectDto) {
    return this.provisioningProjectsService.create(dto);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.provisioningProjectsService.getById(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProvisioningProjectDto) {
    return this.provisioningProjectsService.update(id, dto);
  }
}
