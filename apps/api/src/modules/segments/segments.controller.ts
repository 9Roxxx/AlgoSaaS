import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto';

@ApiTags('segments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('segments')
export class SegmentsController {
  constructor(private segmentsService: SegmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Список сегментов' })
  async list(@Request() req) {
    return this.segmentsService.list(req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать сегмент' })
  async create(@Request() req, @Body() dto: CreateSegmentDto) {
    return this.segmentsService.create(req.user.tenantId, dto);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Предпросмотр аудитории сегмента' })
  async preview(@Request() req, @Param('id') id: string) {
    return this.segmentsService.preview(req.user.tenantId, id);
  }
}

