import { ApiPropertyOptional } from "@nestjs/swagger";
import { BillingPlan, BillingProfileStatus, Currency } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateTenantBillingProfileDto {
  @ApiPropertyOptional({ enum: BillingPlan })
  @IsOptional()
  @IsEnum(BillingPlan)
  plan?: BillingPlan;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ example: 1250 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyAmount?: number;

  @ApiPropertyOptional({ enum: BillingProfileStatus })
  @IsOptional()
  @IsEnum(BillingProfileStatus)
  status?: BillingProfileStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;
}
