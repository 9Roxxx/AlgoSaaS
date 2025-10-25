import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ enum: ['TELEGRAM', 'VK', 'EMAIL', 'SMS', 'WHATSAPP'] })
  @IsEnum(['TELEGRAM', 'VK', 'EMAIL', 'SMS', 'WHATSAPP'])
  channel: string;

  @ApiProperty({ example: 'Пробный урок Python' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Привет, {{parent_name}}! Приглашаем на урок...' })
  @IsString()
  body: string;

  @ApiProperty({ example: ['parent_name', 'child_age'], required: false })
  @IsOptional()
  @IsArray()
  variables?: string[];

  @ApiProperty({ enum: ['DRAFT', 'APPROVED', 'BLOCKED'], required: false })
  @IsOptional()
  @IsEnum(['DRAFT', 'APPROVED', 'BLOCKED'])
  status?: string;

  @ApiProperty({ enum: ['VALUE_FIRST', 'OFFER', 'SERVICE'], required: false })
  @IsOptional()
  @IsEnum(['VALUE_FIRST', 'OFFER', 'SERVICE'])
  category?: string;
}

export class RenderTemplateDto {
  @ApiProperty({ example: { parent_name: 'Анна', child_age: 10 } })
  variables: Record<string, any>;
}

