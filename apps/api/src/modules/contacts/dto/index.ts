import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsInt, IsObject } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: '+79161234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'parent@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsOptional()
  @IsString()
  tgId?: string;

  @ApiProperty({ example: 'vk_987654', required: false })
  @IsOptional()
  @IsString()
  vkUserId?: string;

  @ApiProperty({ example: 'Москва', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  childAge?: number;

  @ApiProperty({ example: { tracks: ['python'] }, required: false })
  @IsOptional()
  @IsObject()
  interests?: any;
}

export class ImportContactsDto {
  @ApiProperty({ 
    description: 'CSV данные (phone,email,city,childAge)',
    example: 'phone,email,city,childAge\n+79161234567,test@example.com,Москва,10'
  })
  @IsString()
  csvData: string;
}

