import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, RenderTemplateDto } from './dto';

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Список шаблонов' })
  async list(@Request() req) {
    return this.templatesService.list(req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать шаблон' })
  async create(@Request() req, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(req.user.tenantId, dto);
  }

  @Post(':id/render')
  @ApiOperation({ summary: 'Рендерить шаблон с переменными' })
  async render(@Request() req, @Param('id') id: string, @Body() dto: RenderTemplateDto) {
    return this.templatesService.render(req.user.tenantId, id, dto.variables);
  }
}

