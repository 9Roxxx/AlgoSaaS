import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@algor/db';
import * as yaml from 'js-yaml';
import { OrchestrationPolicySchema } from '@algor/shared';

@Injectable()
export class OrchestrationService {
  async getActivePolicy(tenantId: string) {
    const rule = await prisma.orchestrationRule.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!rule) {
      return null;
    }

    const policy = yaml.load(rule.yaml);

    return {
      id: rule.id,
      version: rule.version,
      policy,
      createdAt: rule.createdAt,
    };
  }

  async createRule(tenantId: string, yamlContent: string) {
    // Парсинг YAML
    let policy: any;
    try {
      policy = yaml.load(yamlContent);
    } catch (error) {
      throw new BadRequestException('Invalid YAML format: ' + error.message);
    }

    // Валидация через Zod
    const validation = OrchestrationPolicySchema.safeParse(policy);
    if (!validation.success) {
      throw new BadRequestException('Policy validation failed: ' + JSON.stringify(validation.error.errors));
    }

    // Деактивировать старые правила
    await prisma.orchestrationRule.updateMany({
      where: {
        tenantId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Создать новое правило
    const latestVersion = await prisma.orchestrationRule.findFirst({
      where: { tenantId },
      orderBy: { version: 'desc' },
    });

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    const rule = await prisma.orchestrationRule.create({
      data: {
        tenantId,
        yaml: yamlContent,
        version: newVersion,
        isActive: true,
      },
    });

    return {
      id: rule.id,
      version: rule.version,
      policy: validation.data,
      createdAt: rule.createdAt,
    };
  }
}

