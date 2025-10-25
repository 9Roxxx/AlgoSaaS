import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSegmentDto {
  @ApiProperty({ example: 'Москва, 9-12 лет, без записи' })
  @IsString()
  name: string;

  @ApiProperty({
    example: '{"city":"Москва","childAge":{"gte":9,"lte":12},"interests.trialBooked":false}',
  })
  @IsString()
  filterDsl: string;
}

