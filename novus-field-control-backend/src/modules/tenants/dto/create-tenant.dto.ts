import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TenantStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUrl, Matches, MaxLength } from "class-validator";

const DOMAIN_PATTERN =
  /^(?:(?:https?:\/\/)?(?:(?:localhost)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d{1,5})?|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,})$/i;

export class CreateTenantDto {
  @ApiProperty({
    description: "Stable tenant slug used by mobile and administrative discovery.",
    example: "acme",
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiPropertyOptional({
    description: "Optional company code that can also resolve the tenant.",
    example: "ACME001",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  companyCode?: string;

  @ApiProperty({ example: "ACME Distribuidora" })
  @IsString()
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({ enum: TenantStatus, default: TenantStatus.provisioning })
  @IsEnum(TenantStatus)
  status!: TenantStatus;

  @ApiProperty({ example: "acme.seusistema.com" })
  @IsString()
  @MaxLength(255)
  @Matches(DOMAIN_PATTERN)
  baseDomain!: string;

  @ApiPropertyOptional({ example: "https://api.acme.seusistema.com" })
  @IsOptional()
  @IsUrl({ require_tld: false })
  apiBaseUrl?: string;

  @ApiPropertyOptional({ example: "https://ws.acme.seusistema.com" })
  @IsOptional()
  @IsUrl({ require_tld: false })
  wsBaseUrl?: string;

  @ApiPropertyOptional({ example: "https://app.acme.seusistema.com" })
  @IsOptional()
  @IsUrl({ require_tld: false })
  webBaseUrl?: string;

  @ApiPropertyOptional({ example: "https://assets.acme.seusistema.com" })
  @IsOptional()
  @IsUrl({ require_tld: false })
  assetsBaseUrl?: string;
}
