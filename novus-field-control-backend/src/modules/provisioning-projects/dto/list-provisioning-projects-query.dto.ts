import { ApiPropertyOptional } from "@nestjs/swagger";
import { ProvisioningProjectStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class ListProvisioningProjectsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: ProvisioningProjectStatus })
  @IsOptional()
  @IsEnum(ProvisioningProjectStatus)
  status?: ProvisioningProjectStatus;
}
