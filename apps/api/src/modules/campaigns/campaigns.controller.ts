import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, StartCampaignDto } from './dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'Список кампаний' })
  async list(@Request() req) {
    return this.campaignsService.list(req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать кампанию' })
  async create(@Request() req, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(req.user.tenantId, dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Запустить кампанию' })
  async start(@Request() req, @Param('id') id: string, @Body() dto: StartCampaignDto) {
    return this.campaignsService.start(req.user.tenantId, id, dto);
  }

  @Put(':id/pause')
  @ApiOperation({ summary: 'Приостановить кампанию' })
  async pause(@Request() req, @Param('id') id: string) {
    return this.campaignsService.pause(req.user.tenantId, id);
  }

  @Put(':id/stop')
  @ApiOperation({ summary: 'Остановить кампанию' })
  async stop(@Request() req, @Param('id') id: string) {
    return this.campaignsService.stop(req.user.tenantId, id);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Метрики кампании' })
  async metrics(@Request() req, @Param('id') id: string) {
    return this.campaignsService.getMetrics(req.user.tenantId, id);
  }
}

