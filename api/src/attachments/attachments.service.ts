import { Injectable, NotFoundException, ForbiddenException, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { IStorageProvider } from '../storage/interfaces/storage-provider.interface';
import { STORAGE_PROVIDER } from '../storage/storage.constants';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AttachmentsService {
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private storageProvider: IStorageProvider,
    private configService: ConfigService,
    private i18n: I18nService,
  ) {
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB default
    this.allowedMimeTypes = this.configService.get<string>('ALLOWED_MIME_TYPES', 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(',');
  }

  async uploadAttachment(
    file: any,
    tenantId: string,
    userId: string,
    briefingId?: string,
    templateId?: string,
    lang: string = 'pt',
  ) {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        this.i18n.translate('ATTACHMENTS.FILE_TOO_LARGE', {
          lang,
          args: { maxSize: `${this.maxFileSize / 1024 / 1024}MB` },
        }),
      );
    }

    // Validate mime type
    if (!this.isMimeTypeAllowed(file.mimetype)) {
      throw new BadRequestException(
        this.i18n.translate('ATTACHMENTS.INVALID_FILE_TYPE', { lang }),
      );
    }

    // Validate ownership if briefingId or templateId provided
    if (briefingId) {
      await this.validateBriefingAccess(briefingId, tenantId, userId, lang);
    }

    if (templateId) {
      await this.validateTemplateAccess(templateId, tenantId, userId, lang);
    }

    // Generate unique storage key
    const ext = path.extname(file.originalname);
    const storageKey = `${tenantId}/${uuidv4()}${ext}`;

    // Upload to storage provider
    const uploadResult = await this.storageProvider.upload(file.buffer, storageKey, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        tenantId,
        userId,
      },
    });

    // Save to database
    const attachment = await this.prisma.attachment.create({
      data: {
        tenantId,
        briefingId,
        templateId,
        userId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageProvider: this.configService.get<string>('STORAGE_PROVIDER', 'local'),
        storageKey: uploadResult.key,
        storageMetadata: {},
        previewUrl: uploadResult.url,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return attachment;
  }

  async listAttachments(
    tenantId: string,
    userId: string,
    briefingId?: string,
    templateId?: string,
    lang: string = 'pt',
  ) {
    // Build where clause
    const where: any = { tenantId };

    if (briefingId) {
      await this.validateBriefingAccess(briefingId, tenantId, userId, lang);
      where.briefingId = briefingId;
    }

    if (templateId) {
      await this.validateTemplateAccess(templateId, tenantId, userId, lang);
      where.templateId = templateId;
    }

    return this.prisma.attachment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAttachment(id: string, tenantId: string, userId: string, lang: string = 'pt') {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException(this.i18n.translate('ATTACHMENTS.NOT_FOUND', { lang }));
    }

    // Validate access
    if (attachment.briefingId) {
      await this.validateBriefingAccess(attachment.briefingId, tenantId, userId, lang);
    }

    if (attachment.templateId) {
      await this.validateTemplateAccess(attachment.templateId, tenantId, userId, lang);
    }

    return attachment;
  }

  async downloadAttachment(id: string, tenantId: string, userId: string, lang: string = 'pt') {
    const attachment = await this.getAttachment(id, tenantId, userId, lang);

    // Download from storage
    const fileBuffer = await this.storageProvider.download(attachment.storageKey);

    return {
      buffer: fileBuffer,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }

  async deleteAttachment(id: string, tenantId: string, userId: string, lang: string = 'pt') {
    const attachment = await this.getAttachment(id, tenantId, userId, lang);

    // Check if user is owner or has permission
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId, role: { in: ['TENANT_ADMIN', 'ARCHITECT'] } },
    });

    if (attachment.userId !== userId && !isMember) {
      throw new ForbiddenException(this.i18n.translate('ATTACHMENTS.NO_PERMISSION', { lang }));
    }

    // Delete from storage
    try {
      await this.storageProvider.delete(attachment.storageKey);
    } catch (error) {
      // Log error but continue with database deletion
      console.error('Failed to delete file from storage:', error);
    }

    // Delete from database
    await this.prisma.attachment.delete({ where: { id } });

    return {
      message: this.i18n.translate('ATTACHMENTS.DELETED', { lang }),
    };
  }

  async getSignedUrl(id: string, tenantId: string, userId: string, expiresIn: number = 3600, lang: string = 'pt') {
    const attachment = await this.getAttachment(id, tenantId, userId, lang);

    const url = await this.storageProvider.getSignedUrl(attachment.storageKey, expiresIn);

    return { url };
  }

  private isMimeTypeAllowed(mimeType: string): boolean {
    return this.allowedMimeTypes.some((allowed) => {
      if (allowed.endsWith('/*')) {
        const prefix = allowed.slice(0, -2);
        return mimeType.startsWith(prefix);
      }
      return mimeType === allowed;
    });
  }

  private async validateBriefingAccess(briefingId: string, tenantId: string, userId: string, lang: string) {
    const briefing = await this.prisma.briefing.findFirst({
      where: { id: briefingId, tenantId },
    });

    if (!briefing) {
      throw new NotFoundException(this.i18n.translate('BRIEFS.NOT_FOUND', { lang }));
    }

    // Check if user is owner, client, member, or collaborator
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId },
    });

    const isCollaborator = await this.prisma.collaboration.findUnique({
      where: { briefingId_userId: { briefingId, userId } },
    });

    if (briefing.clientId !== userId && !isMember && !isCollaborator) {
      throw new ForbiddenException(this.i18n.translate('BRIEFS.NO_PERMISSION', { lang }));
    }
  }

  private async validateTemplateAccess(templateId: string, tenantId: string, userId: string, lang: string) {
    const template = await this.prisma.template.findFirst({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException(this.i18n.translate('TEMPLATES.NOT_FOUND', { lang }));
    }

    // Only members can upload to templates
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId },
    });

    if (!isMember) {
      throw new ForbiddenException(this.i18n.translate('TEMPLATES.NO_PERMISSION', { lang }));
    }
  }
}
