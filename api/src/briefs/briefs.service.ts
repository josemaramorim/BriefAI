import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { BriefingStatus } from '@prisma/client';
import Ajv from 'ajv';
import { CreateBriefDto } from './dto/create-brief.dto';
import { UpdateBriefDto } from './dto/update-brief.dto';

@Injectable()
export class BriefsService {
  private ajv: Ajv;

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    this.ajv = new Ajv({ allErrors: true });
  }

  async findAll(
    tenantId: string,
    userId?: string,
    status?: BriefingStatus,
    templateId?: string,
  ) {
    const where: any = { tenantId };
    
    if (status) {
      where.status = status;
    }
    
    if (templateId) {
      where.templateId = templateId;
    }

    // Users can see briefs where they are the client or member of the tenant
    if (userId) {
      where.OR = [
        { clientId: userId },
        { tenant: { memberships: { some: { userId } } } }
      ];
    }

    return this.prisma.briefing.findMany({
      where,
      include: {
        template: { select: { id: true, title: true } },
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string, userId?: string, lang?: string) {
    const brief = await this.prisma.briefing.findFirst({
      where: { id, tenantId },
      include: {
        template: { select: { id: true, title: true, jsonSchema: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });

    if (!brief) {
      throw new NotFoundException(
        this.i18n.translate('BRIEFS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    // Check access: user must be client or tenant member
    if (userId) {
      const isMember = await this.prisma.membership.findFirst({
        where: { tenantId, userId },
      });
      if (!isMember && brief.clientId !== userId) {
        throw new ForbiddenException(
          this.i18n.translate('BRIEFS.ACCESS_DENIED', { lang: lang || 'pt' }),
        );
      }
    }

    return brief;
  }

  async create(dto: CreateBriefDto, tenantId: string, userId: string) {
    // Validate template exists and get schema
    const template = await this.prisma.template.findFirst({
      where: {
        id: dto.templateId,
        OR: [{ tenantId }, { isPublic: true }],
      },
    });

    if (!template) {
      throw new NotFoundException(
        this.i18n.translate('TEMPLATES.NOT_FOUND', { lang: 'pt' }),
      );
    }

    // Validate answersJson against template schema
    if (dto.answersJson) {
      this.validateAnswers(dto.answersJson, template.jsonSchema);
    }

    // Validate clientId if provided
    if (dto.clientId) {
      const client = await this.prisma.user.findUnique({
        where: { id: dto.clientId },
      });
      if (!client) {
        throw new BadRequestException(
          this.i18n.translate('BRIEFS.CLIENT_NOT_FOUND', { lang: 'pt' }),
        );
      }
    }

    const brief = await this.prisma.briefing.create({
      data: {
        tenantId,
        templateId: dto.templateId,
        clientId: dto.clientId,
        answersJson: dto.answersJson || {},
        status: BriefingStatus.DRAFT,
        progress: 0,
      },
      include: {
        template: { select: { id: true, title: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return brief;
  }

  async update(
    id: string,
    dto: UpdateBriefDto,
    tenantId: string,
    userId: string,
    lang?: string,
  ) {
    const brief = await this.prisma.briefing.findFirst({
      where: { id, tenantId },
      include: { template: true },
    });

    if (!brief) {
      throw new NotFoundException(
        this.i18n.translate('BRIEFS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    // Check access: user must be client or tenant member
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId },
    });
    if (!isMember && brief.clientId !== userId) {
      throw new ForbiddenException(
        this.i18n.translate('BRIEFS.ACCESS_DENIED', { lang: lang || 'pt' }),
      );
    }

    // Validate answersJson if provided
    if (dto.answersJson) {
      this.validateAnswers(dto.answersJson, brief.template.jsonSchema);
    }

    const updated = await this.prisma.briefing.update({
      where: { id },
      data: {
        answersJson: dto.answersJson,
        status: dto.status,
        progress: dto.progress,
        updatedAt: new Date(),
      },
      include: {
        template: { select: { id: true, title: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return updated;
  }

  async delete(id: string, tenantId: string, userId: string, lang?: string) {
    const brief = await this.prisma.briefing.findFirst({
      where: { id, tenantId },
    });

    if (!brief) {
      throw new NotFoundException(
        this.i18n.translate('BRIEFS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    // Only tenant members can delete (not clients)
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId },
    });
    if (!isMember) {
      throw new ForbiddenException(
        this.i18n.translate('BRIEFS.DELETE_DENIED', { lang: lang || 'pt' }),
      );
    }

    await this.prisma.briefing.delete({ where: { id } });

    return { message: this.i18n.translate('BRIEFS.DELETED', { lang: lang || 'pt' }) };
  }

  private validateAnswers(answers: Record<string, any>, schema: any): void {
    const validate = this.ajv.compile(schema);
    const valid = validate(answers);

    if (!valid) {
      const errors = validate.errors?.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new BadRequestException(
        this.i18n.translate('BRIEFS.INVALID_ANSWERS', { 
          lang: 'pt',
          args: { errors: errors || 'Invalid data' }
        }),
      );
    }
  }
}
