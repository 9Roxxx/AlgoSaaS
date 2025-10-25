import { Injectable } from '@nestjs/common';
import { prisma } from '@algor/db';
import { CreateContactDto, ImportContactsDto } from './dto';
import { parse } from 'csv-parse/sync';

@Injectable()
export class ContactsService {
  async list(tenantId: string, options: { page: number; pageSize: number; search?: string }) {
    const { page, pageSize, search } = options;
    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          email: true,
          tgId: true,
          vkUserId: true,
          city: true,
          childAge: true,
          interests: true,
          createdAt: true,
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(tenantId: string, dto: CreateContactDto) {
    return prisma.contact.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }

  async importContacts(tenantId: string, dto: ImportContactsDto) {
    // Парсинг CSV
    const records = parse(dto.csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    const imported = [];
    const errors = [];

    for (const record of records) {
      try {
        const contact = await prisma.contact.upsert({
          where: {
            tenantId_phone: {
              tenantId,
              phone: record.phone,
            },
          },
          update: {
            email: record.email || undefined,
            city: record.city || undefined,
            childAge: record.childAge ? parseInt(record.childAge) : undefined,
          },
          create: {
            tenantId,
            phone: record.phone,
            email: record.email || undefined,
            city: record.city || undefined,
            childAge: record.childAge ? parseInt(record.childAge) : undefined,
            interests: {},
          },
        });
        imported.push(contact.id);
      } catch (error) {
        errors.push({ record, error: error.message });
      }
    }

    return {
      imported: imported.length,
      errors: errors.length,
      errorDetails: errors,
    };
  }
}

