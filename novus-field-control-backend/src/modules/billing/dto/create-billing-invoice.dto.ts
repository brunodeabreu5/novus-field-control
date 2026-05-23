import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BillingInvoiceStatus, Currency } from "@prisma/client";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class CreateBillingInvoiceDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: "NF-2026-001" })
  @IsString()
  @MaxLength(80)
  number!: string;

  @ApiProperty({ example: 1250 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: Currency, default: Currency.PYG })
  @IsEnum(Currency)
  currency!: Currency;

  @ApiProperty({ example: "2026-03-18" })
  @IsDateString()
  issueDate!: string;

  @ApiProperty({ example: "2026-03-28" })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ enum: BillingInvoiceStatus, default: BillingInvoiceStatus.issued })
  @IsEnum(BillingInvoiceStatus)
  status!: BillingInvoiceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;
}
