import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuppressionsService } from './suppressions.service';
import { CreateSuppressionDto } from './dto';

@ApiTags('suppressions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppressions')
export class SuppressionsController {
  constructor(private suppressionsService: SuppressionsService) {}

  @Get()
  @ApiOperation({ summary: 'Список исключений (отписок)' })
  async list(@Request() req, @Query('contactId') contactId?: string) {
    return this.suppressionsService.list(req.user.tenantId, contactId);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить в список исключений' })
  async create(@Request() req, @Body() dto: CreateSuppressionDto) {
    return this.suppressionsService.create(req.user.tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить из списка исключений' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.suppressionsService.remove(req.user.tenantId, id);
  }
}

