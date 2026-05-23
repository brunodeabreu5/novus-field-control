import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

export class ResolveTenantDto {
  @ApiPropertyOptional({ example: "acme" })
  @ValidateIf((value: ResolveTenantDto) => !value.companyCode)
  @IsString()
  @MaxLength(50)
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: "ACME001" })
  @ValidateIf((value: ResolveTenantDto) => !value.slug)
  @IsString()
  @MaxLength(50)
  @IsOptional()
  companyCode?: string;
}
