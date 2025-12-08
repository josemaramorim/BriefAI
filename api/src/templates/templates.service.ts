import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import Ajv from 'ajv';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  private readonly ajv: Ajv;

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    this.ajv = new Ajv({ strict: false });
  }

  async findAll(tenantId: string, userId?: string) {
    return this.prisma.template.findMany({
      where: {
        tenantId,
        OR: [
          { isPublic: true },
          { ownerId: userId },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            briefings: true,
            versions: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string, userId?: string, lang = 'pt') {
    const template = await this.prisma.template.findFirst({
      where: {
        id,
        tenantId,
        OR: [
          { isPublic: true },
          { ownerId: userId },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            briefings: true,
            versions: true,
          },
        },
      },
    });

    if (!template) {
      const msg = await this.i18n.translate('TEMPLATES.NOT_FOUND', { lang });
      throw new NotFoundException(msg);
    }

    return template;
  }

  async create(dto: CreateTemplateDto, tenantId: string, userId: string) {
    // Validate JSON Schema
    try {
      this.ajv.compile(dto.jsonSchema);
    } catch (error) {
      throw new BadRequestException('Invalid JSON Schema format');
    }

    return this.prisma.template.create({
      data: {
        title: dto.title,
        jsonSchema: dto.jsonSchema,
        isPublic: dto.isPublic ?? false,
        tenantId,
        ownerId: userId,
        version: 1,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateTemplateDto, tenantId: string, userId: string, lang = 'pt') {
    const template = await this.findOne(id, tenantId, userId, lang);

    if (template.ownerId !== userId) {
      const msg = await this.i18n.translate('COMMON.FORBIDDEN', { lang });
      throw new ForbiddenException(msg);
    }

    // If updating jsonSchema, validate it and create version
    if (dto.jsonSchema) {
      try {
        this.ajv.compile(dto.jsonSchema);
      } catch (error) {
        throw new BadRequestException('Invalid JSON Schema format');
      }

      // Create version snapshot
      await this.prisma.templateVersion.create({
        data: {
          tenantId,
          templateId: id,
          version: template.version,
          jsonSchema: template.jsonSchema as any,
        },
      });
    }

    return this.prisma.template.update({
      where: { id },
      data: {
        ...dto,
        version: dto.jsonSchema ? template.version + 1 : template.version,
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async publish(id: string, isPublic: boolean, tenantId: string, userId: string, lang = 'pt') {
    const template = await this.findOne(id, tenantId, userId, lang);

    if (template.ownerId !== userId) {
      const msg = await this.i18n.translate('COMMON.FORBIDDEN', { lang });
      throw new ForbiddenException(msg);
    }

    return this.prisma.template.update({
      where: { id },
      data: { isPublic },
    });
  }

  async delete(id: string, tenantId: string, userId: string, lang = 'pt') {
    const template = await this.findOne(id, tenantId, userId, lang);

    if (template.ownerId !== userId) {
      const msg = await this.i18n.translate('COMMON.FORBIDDEN', { lang });
      throw new ForbiddenException(msg);
    }

    return this.prisma.template.delete({ where: { id } });
  }

  async listVersions(id: string, tenantId: string, userId?: string, lang = 'pt') {
    await this.findOne(id, tenantId, userId, lang);

    return this.prisma.templateVersion.findMany({
      where: {
        templateId: id,
        tenantId,
      },
      orderBy: { version: 'desc' },
    });
  }
}
