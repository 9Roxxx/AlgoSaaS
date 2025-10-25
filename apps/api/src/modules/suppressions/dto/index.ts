import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSuppressionDto {
  @ApiProperty()
  @IsString()
  contactId: string;

  @ApiProperty({ enum: ['TELEGRAM', 'VK', 'EMAIL', 'SMS', 'WHATSAPP'], required: false })
  @IsOptional()
  @IsEnum(['TELEGRAM', 'VK', 'EMAIL', 'SMS', 'WHATSAPP'])
  channel?: string | null;

  @ApiProperty({ example: 'user_request' })
  @IsString()
  reason: string;
}

