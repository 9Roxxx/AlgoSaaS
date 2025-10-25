import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsArray, IsNumber } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Пробный урок Python - Москва' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  channelPolicy?: any;
}

export class StartCampaignDto {
  @ApiProperty({ example: 'segment_id_123' })
  @IsString()
  segmentId: string;

  @ApiProperty({ example: ['template_id_1', 'template_id_2'] })
  @IsArray()
  templateIds: string[];

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @IsNumber()
  waveSize?: number;
}

