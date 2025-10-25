import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CreateContactDto, ImportContactsDto } from './dto';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Список контактов' })
  async list(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 50,
    @Query('search') search?: string,
  ) {
    return this.contactsService.list(req.user.tenantId, { page, pageSize, search });
  }

  @Post()
  @ApiOperation({ summary: 'Создать контакт' })
  async create(@Request() req, @Body() dto: CreateContactDto) {
    return this.contactsService.create(req.user.tenantId, dto);
  }

  @Post('import')
  @ApiOperation({ summary: 'Импорт контактов из CSV' })
  async import(@Request() req, @Body() dto: ImportContactsDto) {
    return this.contactsService.importContacts(req.user.tenantId, dto);
  }
}

