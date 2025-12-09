import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { ExportFormat } from './dto/export-briefing.dto';
import PDFDocument from 'pdfkit';
import * as archiver from 'archiver';
import { Readable } from 'stream';
import { IStorageProvider } from '../storage/interfaces/storage-provider.interface';
import { STORAGE_PROVIDER } from '../storage/storage.constants';

@Injectable()
export class ExportsService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
    @Inject(STORAGE_PROVIDER) private storageProvider: IStorageProvider,
  ) {}

  async exportBriefing(
    briefingId: string,
    tenantId: string,
    userId: string,
    format: ExportFormat,
    options: {
      includeAttachments?: boolean;
      includeComments?: boolean;
      summarized?: boolean;
    },
    lang: string = 'pt',
  ) {
    // Get briefing with all related data
    const briefing = await this.getBriefingForExport(briefingId, tenantId, userId, lang);

    switch (format) {
      case ExportFormat.PDF:
        return this.generatePDF(briefing, options, lang);
      case ExportFormat.JSON:
        return this.generateJSON(briefing, options);
      case ExportFormat.ZIP:
        return this.generateZIP(briefing, options, lang);
      default:
        return this.generatePDF(briefing, options, lang);
    }
  }

  private async getBriefingForExport(
    briefingId: string,
    tenantId: string,
    userId: string,
    lang: string,
  ) {
    const briefing = await this.prisma.briefing.findFirst({
      where: { id: briefingId, tenantId },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            jsonSchema: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        collaborations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!briefing) {
      throw new NotFoundException(this.i18n.translate('BRIEFS.NOT_FOUND', { lang }));
    }

    // Validate access
    await this.validateBriefingAccess(briefing, tenantId, userId, lang);

    return briefing;
  }

  private async validateBriefingAccess(briefing: any, tenantId: string, userId: string, lang: string) {
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId },
    });

    const isCollaborator = await this.prisma.collaboration.findUnique({
      where: {
        briefingId_userId: {
          briefingId: briefing.id,
          userId,
        },
      },
    });

    if (briefing.clientId !== userId && !isMember && !isCollaborator) {
      throw new ForbiddenException(this.i18n.translate('BRIEFS.ACCESS_DENIED', { lang }));
    }
  }

  private async generatePDF(briefing: any, options: any, lang: string) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text(briefing.template.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`${this.i18n.translate('EXPORTS.CLIENT', { lang })}: ${briefing.client?.name || 'N/A'}`);
    doc.text(`${this.i18n.translate('EXPORTS.STATUS', { lang })}: ${briefing.status}`);
    doc.text(`${this.i18n.translate('EXPORTS.PROGRESS', { lang })}: ${briefing.progress}%`);
    doc.text(`${this.i18n.translate('EXPORTS.CREATED_AT', { lang })}: ${new Date(briefing.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Answers
    const answers = briefing.answersJson as Record<string, any>;
    const schema = briefing.template.jsonSchema as any;

    if (!options.summarized) {
      doc.fontSize(16).text(this.i18n.translate('EXPORTS.ANSWERS', { lang }), { underline: true });
      doc.moveDown();

      if (schema.properties) {
        for (const [key, value] of Object.entries(answers)) {
          const fieldSchema = schema.properties[key];
          if (fieldSchema) {
            doc.fontSize(12).font('Helvetica-Bold').text(`${fieldSchema.title || key}:`);
            doc.font('Helvetica').text(this.formatAnswer(value), { indent: 20 });
            doc.moveDown(0.5);
          }
        }
      }
    } else {
      // Summarized version - only key fields
      doc.fontSize(16).text(this.i18n.translate('EXPORTS.SUMMARY', { lang }), { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(this.i18n.translate('EXPORTS.COMPLETED_FIELDS', { lang, args: { count: Object.keys(answers).length } }));
      doc.moveDown();
    }

    // Comments
    if (options.includeComments && briefing.comments.length > 0) {
      doc.addPage();
      doc.fontSize(16).text(this.i18n.translate('EXPORTS.COMMENTS', { lang }), { underline: true });
      doc.moveDown();

      briefing.comments.forEach((comment: any) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`${comment.user.name}:`);
        doc.font('Helvetica').text(comment.content, { indent: 20 });
        doc.fontSize(8).text(new Date(comment.createdAt).toLocaleString(), { indent: 20 });
        doc.moveDown(0.5);
      });
    }

    // Attachments list
    if (briefing.attachments.length > 0) {
      doc.addPage();
      doc.fontSize(16).text(this.i18n.translate('EXPORTS.ATTACHMENTS', { lang }), { underline: true });
      doc.moveDown();

      briefing.attachments.forEach((attachment: any, index: number) => {
        doc.fontSize(10).text(`${index + 1}. ${attachment.originalName} (${this.formatBytes(attachment.size)})`);
        doc.fontSize(8).text(`   ${this.i18n.translate('EXPORTS.UPLOADED_BY', { lang })}: ${attachment.user.name}`, { indent: 20 });
        doc.moveDown(0.3);
      });
    }

    doc.end();

    return new Promise<{ buffer: Buffer; filename: string; mimeType: string }>((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          buffer,
          filename: `briefing-${briefing.id}.pdf`,
          mimeType: 'application/pdf',
        });
      });
    });
  }

  private generateJSON(briefing: any, options: any) {
    const data: any = {
      id: briefing.id,
      template: {
        id: briefing.template.id,
        title: briefing.template.title,
      },
      client: briefing.client,
      status: briefing.status,
      progress: briefing.progress,
      answers: briefing.answersJson,
      createdAt: briefing.createdAt,
      updatedAt: briefing.updatedAt,
    };

    if (options.includeComments) {
      data.comments = briefing.comments;
    }

    if (options.includeAttachments) {
      data.attachments = briefing.attachments.map((att: any) => ({
        id: att.id,
        originalName: att.originalName,
        mimeType: att.mimeType,
        size: att.size,
        uploadedBy: att.user.name,
        createdAt: att.createdAt,
      }));
    }

    const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');

    return Promise.resolve({
      buffer,
      filename: `briefing-${briefing.id}.json`,
      mimeType: 'application/json',
    });
  }

  private async generateZIP(briefing: any, options: any, lang: string) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));

    // Add JSON file
    const jsonExport = await this.generateJSON(briefing, options);
    archive.append(jsonExport.buffer, { name: jsonExport.filename });

    // Add PDF file
    const pdfExport = await this.generatePDF(briefing, options, lang);
    archive.append(pdfExport.buffer, { name: pdfExport.filename });

    // Add attachments
    if (options.includeAttachments && briefing.attachments.length > 0) {
      for (const attachment of briefing.attachments) {
        try {
          const fileBuffer = await this.storageProvider.download(attachment.storageKey);
          archive.append(fileBuffer, { name: `attachments/${attachment.originalName}` });
        } catch (error) {
          console.error(`Failed to download attachment ${attachment.id}:`, error);
        }
      }
    }

    archive.finalize();

    return new Promise<{ buffer: Buffer; filename: string; mimeType: string }>((resolve, reject) => {
      archive.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          buffer,
          filename: `briefing-${briefing.id}.zip`,
          mimeType: 'application/zip',
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });
    });
  }

  private formatAnswer(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
