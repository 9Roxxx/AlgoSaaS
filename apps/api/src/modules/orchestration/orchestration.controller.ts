import { Controller, Get, Post, Body, UseGuards, Request, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrchestrationService } from './orchestration.service';

@ApiTags('orchestration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orchestration')
export class OrchestrationController {
  constructor(private orchestrationService: OrchestrationService) {}

  @Get('policy')
  @ApiOperation({ summary: 'Получить активную политику оркестрации' })
  async getPolicy(@Request() req) {
    return this.orchestrationService.getActivePolicy(req.user.tenantId);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Загрузить и активировать YAML политику' })
  async uploadRules(
    @Request() req,
    @Body() body: { yaml: string },
    @Headers('content-type') contentType?: string,
  ) {
    // Поддержка как JSON, так и raw YAML
    const yamlContent = typeof body === 'string' ? body : body.yaml;
    return this.orchestrationService.createRule(req.user.tenantId, yamlContent);
  }
}

