import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateConsentDto {
  @ApiProperty()
  @IsString()
  contactId: string;

  @ApiProperty({ enum: ['TELEGRAM', 'VK', 'EMAIL', 'SMS', 'WHATSAPP'] })
  @IsEnum(['TELEGRAM', 'VK', 'EMAIL', 'SMS', 'WHATSAPP'])
  channel: string;

  @ApiProperty({ enum: ['PROMO', 'SERVICE'] })
  @IsEnum(['PROMO', 'SERVICE'])
  scope: string;

  @ApiProperty({ enum: ['FORM', 'QR', 'C2WA', 'TG_START', 'VK_SUB', 'IMPORT'] })
  @IsEnum(['FORM', 'QR', 'C2WA', 'TG_START', 'VK_SUB', 'IMPORT'])
  source: string;

  @ApiProperty({ example: '2024-01' })
  @IsString()
  policyVersion: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  proofUrl?: string;
}

