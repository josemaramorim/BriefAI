import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsService } from './attachments.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { STORAGE_PROVIDER } from '../storage/storage.constants';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1234',
}));

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let prisma: PrismaService;
  let storageProvider: any;

  const mockFile: any = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test content'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: PrismaService,
          useValue: {
            attachment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              delete: jest.fn(),
            },
            briefing: {
              findFirst: jest.fn(),
            },
            template: {
              findFirst: jest.fn(),
            },
            membership: {
              findFirst: jest.fn(),
            },
            collaboration: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: STORAGE_PROVIDER,
          useValue: {
            upload: jest.fn(),
            download: jest.fn(),
            delete: jest.fn(),
            getSignedUrl: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                MAX_FILE_SIZE: 10485760,
                ALLOWED_MIME_TYPES: 'image/*,application/pdf',
                STORAGE_PROVIDER: 'local',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
    prisma = module.get<PrismaService>(PrismaService);
    storageProvider = module.get(STORAGE_PROVIDER);
  });

  describe('uploadAttachment', () => {
    it('should upload attachment successfully', async () => {
      const attachment = {
        id: 'att1',
        originalName: 'test.pdf',
        user: { id: 'user1', name: 'Test User', email: 'test@test.com' },
      };

      jest.spyOn(storageProvider, 'upload').mockResolvedValue({
        key: 'tenant1/uuid.pdf',
        url: 'http://localhost:3000/uploads/tenant1/uuid.pdf',
        size: 1024,
      });

      jest.spyOn(prisma.attachment, 'create').mockResolvedValue(attachment as any);

      const result = await service.uploadAttachment(
        mockFile,
        'tenant1',
        'user1',
        undefined,
        undefined,
        'pt',
      );

      expect(result).toEqual(attachment);
      expect(storageProvider.upload).toHaveBeenCalled();
      expect(prisma.attachment.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if file too large', async () => {
      const largeFile = { ...mockFile, size: 20 * 1024 * 1024 }; // 20MB

      await expect(
        service.uploadAttachment(largeFile, 'tenant1', 'user1', undefined, undefined, 'pt'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invalid mime type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/exe' };

      await expect(
        service.uploadAttachment(invalidFile, 'tenant1', 'user1', undefined, undefined, 'pt'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate briefing access when briefingId provided', async () => {
      const briefing = { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' };

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(briefing as any);
      jest.spyOn(storageProvider, 'upload').mockResolvedValue({
        key: 'key',
        size: 1024,
      });
      jest.spyOn(prisma.attachment, 'create').mockResolvedValue({ id: 'att1' } as any);

      await service.uploadAttachment(mockFile, 'tenant1', 'user1', 'brief1', undefined, 'pt');

      expect(prisma.briefing.findFirst).toHaveBeenCalledWith({
        where: { id: 'brief1', tenantId: 'tenant1' },
      });
    });
  });

  describe('listAttachments', () => {
    it('should list attachments for tenant', async () => {
      const attachments = [{ id: 'att1', originalName: 'test.pdf' }];

      jest.spyOn(prisma.attachment, 'findMany').mockResolvedValue(attachments as any);

      const result = await service.listAttachments('tenant1', 'user1', undefined, undefined, 'pt');

      expect(result).toEqual(attachments);
      expect(prisma.attachment.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1' },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getAttachment', () => {
    it('should get attachment by id', async () => {
      const attachment = {
        id: 'att1',
        tenantId: 'tenant1',
        userId: 'user1',
        briefingId: 'brief1',
      };
      const briefing = { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' };

      jest.spyOn(prisma.attachment, 'findFirst').mockResolvedValue(attachment as any);
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(briefing as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.collaboration, 'findUnique').mockResolvedValue(null);

      const result = await service.getAttachment('att1', 'tenant1', 'user1', 'pt');

      expect(result).toEqual(attachment);
    });

    it('should throw NotFoundException if attachment not found', async () => {
      jest.spyOn(prisma.attachment, 'findFirst').mockResolvedValue(null);

      await expect(service.getAttachment('att1', 'tenant1', 'user1', 'pt')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment', async () => {
      const attachment = {
        id: 'att1',
        tenantId: 'tenant1',
        userId: 'user1',
        storageKey: 'key',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
      };

      jest.spyOn(prisma.attachment, 'findFirst').mockResolvedValue(attachment as any);
      jest.spyOn(storageProvider, 'download').mockResolvedValue(Buffer.from('content'));

      const result = await service.downloadAttachment('att1', 'tenant1', 'user1', 'pt');

      expect(result.originalName).toBe('test.pdf');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(storageProvider.download).toHaveBeenCalledWith('key');
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment by owner', async () => {
      const attachment = {
        id: 'att1',
        tenantId: 'tenant1',
        userId: 'user1',
        storageKey: 'key',
      };

      jest.spyOn(prisma.attachment, 'findFirst').mockResolvedValue(attachment as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);
      jest.spyOn(storageProvider, 'delete').mockResolvedValue(undefined);
      jest.spyOn(prisma.attachment, 'delete').mockResolvedValue(attachment as any);

      const result = await service.deleteAttachment('att1', 'tenant1', 'user1', 'pt');

      expect(result.message).toBeDefined();
      expect(storageProvider.delete).toHaveBeenCalledWith('key');
      expect(prisma.attachment.delete).toHaveBeenCalledWith({ where: { id: 'att1' } });
    });

    it('should throw ForbiddenException if not owner or member', async () => {
      const attachment = {
        id: 'att1',
        tenantId: 'tenant1',
        userId: 'user2',
        storageKey: 'key',
      };

      jest.spyOn(prisma.attachment, 'findFirst').mockResolvedValue(attachment as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);

      await expect(service.deleteAttachment('att1', 'tenant1', 'user1', 'pt')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getSignedUrl', () => {
    it('should get signed URL for attachment', async () => {
      const attachment = {
        id: 'att1',
        tenantId: 'tenant1',
        userId: 'user1',
        storageKey: 'key',
      };

      jest.spyOn(prisma.attachment, 'findFirst').mockResolvedValue(attachment as any);
      jest.spyOn(storageProvider, 'getSignedUrl').mockResolvedValue('http://signed-url.com/file');

      const result = await service.getSignedUrl('att1', 'tenant1', 'user1', 3600, 'pt');

      expect(result.url).toBe('http://signed-url.com/file');
      expect(storageProvider.getSignedUrl).toHaveBeenCalledWith('key', 3600);
    });
  });
});
