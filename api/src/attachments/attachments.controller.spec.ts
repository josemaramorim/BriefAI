import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Response } from 'express';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1234',
}));

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  let service: AttachmentsService;

  const mockAuthUser: AuthUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ARCHITECT' as any,
    tenantId: 'tenant123',
    tenantSlug: 'test-tenant',
    locale: 'pt',
    membershipRole: 'ARCHITECT' as any,
  };

  const mockI18nContext = { lang: 'pt' };

  const mockFile: any = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        {
          provide: AttachmentsService,
          useValue: {
            uploadAttachment: jest.fn(),
            listAttachments: jest.fn(),
            getAttachment: jest.fn(),
            downloadAttachment: jest.fn(),
            deleteAttachment: jest.fn(),
            getSignedUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AttachmentsController>(AttachmentsController);
    service = module.get<AttachmentsService>(AttachmentsService);
  });

  describe('uploadAttachment', () => {
    it('should upload attachment', async () => {
      const result = { id: 'att1', originalName: 'test.pdf' };

      jest.spyOn(service, 'uploadAttachment').mockResolvedValue(result as any);

      const response = await controller.uploadAttachment(
        mockFile,
        undefined,
        undefined,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.uploadAttachment).toHaveBeenCalledWith(
        mockFile,
        'tenant123',
        'user123',
        undefined,
        undefined,
        'pt',
      );
      expect(response).toEqual(result);
    });

    it('should upload attachment with briefingId', async () => {
      const result = { id: 'att1', briefingId: 'brief1' };

      jest.spyOn(service, 'uploadAttachment').mockResolvedValue(result as any);

      await controller.uploadAttachment(
        mockFile,
        'brief1',
        undefined,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.uploadAttachment).toHaveBeenCalledWith(
        mockFile,
        'tenant123',
        'user123',
        'brief1',
        undefined,
        'pt',
      );
    });
  });

  describe('listAttachments', () => {
    it('should list attachments', async () => {
      const attachments = [{ id: 'att1' }, { id: 'att2' }];

      jest.spyOn(service, 'listAttachments').mockResolvedValue(attachments as any);

      const response = await controller.listAttachments(
        undefined,
        undefined,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.listAttachments).toHaveBeenCalledWith(
        'tenant123',
        'user123',
        undefined,
        undefined,
        'pt',
      );
      expect(response).toEqual(attachments);
    });

    it('should filter by briefingId', async () => {
      jest.spyOn(service, 'listAttachments').mockResolvedValue([]);

      await controller.listAttachments(
        'brief1',
        undefined,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.listAttachments).toHaveBeenCalledWith(
        'tenant123',
        'user123',
        'brief1',
        undefined,
        'pt',
      );
    });
  });

  describe('getAttachment', () => {
    it('should get attachment by id', async () => {
      const attachment = { id: 'att1', originalName: 'test.pdf' };

      jest.spyOn(service, 'getAttachment').mockResolvedValue(attachment as any);

      const response = await controller.getAttachment(
        'att1',
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.getAttachment).toHaveBeenCalledWith('att1', 'tenant123', 'user123', 'pt');
      expect(response).toEqual(attachment);
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment', async () => {
      const downloadData = {
        buffer: Buffer.from('test content'),
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
      };

      const mockResponse = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      jest.spyOn(service, 'downloadAttachment').mockResolvedValue(downloadData);

      await controller.downloadAttachment(
        'att1',
        mockResponse,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.downloadAttachment).toHaveBeenCalledWith('att1', 'tenant123', 'user123', 'pt');
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
        'Content-Length': downloadData.buffer.length,
      });
      expect(mockResponse.send).toHaveBeenCalledWith(downloadData.buffer);
    });
  });

  describe('getSignedUrl', () => {
    it('should get signed URL', async () => {
      const result = { url: 'http://signed-url.com/file' };

      jest.spyOn(service, 'getSignedUrl').mockResolvedValue(result);

      const response = await controller.getSignedUrl(
        'att1',
        undefined,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.getSignedUrl).toHaveBeenCalledWith('att1', 'tenant123', 'user123', 3600, 'pt');
      expect(response).toEqual(result);
    });

    it('should get signed URL with custom expiration', async () => {
      const result = { url: 'http://signed-url.com/file' };

      jest.spyOn(service, 'getSignedUrl').mockResolvedValue(result);

      await controller.getSignedUrl(
        'att1',
        7200,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.getSignedUrl).toHaveBeenCalledWith('att1', 'tenant123', 'user123', 7200, 'pt');
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment', async () => {
      const result = { message: 'Deleted' };

      jest.spyOn(service, 'deleteAttachment').mockResolvedValue(result);

      const response = await controller.deleteAttachment(
        'att1',
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.deleteAttachment).toHaveBeenCalledWith('att1', 'tenant123', 'user123', 'pt');
      expect(response).toEqual(result);
    });
  });
});
