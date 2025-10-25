import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './dto';

@ApiTags('consents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consents')
export class ConsentsController {
  constructor(private consentsService: ConsentsService) {}

  @Post()
  @ApiOperation({ summary: 'Добавить согласие (152-ФЗ)' })
  async create(@Request() req, @Body() dto: CreateConsentDto) {
    return this.consentsService.create(req.user.tenantId, dto);
  }

  @Get('contact/:contactId')
  @ApiOperation({ summary: 'Получить согласия контакта' })
  async listByContact(@Request() req, @Param('contactId') contactId: string) {
    return this.consentsService.listByContact(req.user.tenantId, contactId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Отозвать согласие' })
  async revoke(@Request() req, @Param('id') id: string) {
    return this.consentsService.revoke(req.user.tenantId, id);
  }
}

