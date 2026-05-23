import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProvisioningProjectStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateProvisioningProjectDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: "Onboarding ACME" })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownerName?: string;

  @ApiProperty({ enum: ProvisioningProjectStatus, default: ProvisioningProjectStatus.planned })
  @IsEnum(ProvisioningProjectStatus)
  status!: ProvisioningProjectStatus;

  @ApiPropertyOptional({ example: "2026-03-18" })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: "2026-03-25" })
  @IsOptional()
  @IsDateString()
  targetGoLiveAt?: string;
}
