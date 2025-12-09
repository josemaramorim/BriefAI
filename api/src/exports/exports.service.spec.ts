import { Test, TestingModule } from '@nestjs/testing';
import { ExportsService } from './exports.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { STORAGE_PROVIDER } from '../storage/storage.constants';
import { IStorageProvider } from '../storage/interfaces/storage-provider.interface';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ExportFormat } from './dto/export-briefing.dto';

// Mock PDFDocument
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    on: jest.fn((event, callback) => {
      if (event === 'data') {
        setTimeout(() => callback(Buffer.from('pdf content')), 0);
      } else if (event === 'end') {
        setTimeout(callback, 10);
      }
      return this;
    }),
    end: jest.fn(),
  }));
});

describe('ExportsService', () => {
  let service: ExportsService;
  let prismaService: PrismaService;
  let i18nService: I18nService;
  let storageProvider: IStorageProvider;

  const mockBriefing = {
    id: 'briefing-1',
    title: 'Test Briefing',
    tenantId: 'tenant-1',
    clientId: 'user-1',
    templateId: 'template-1',
    status: 'IN_PROGRESS',
    progress: 50,
    answersJson: { field1: 'value1', field2: 'value2' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    template: {
      id: 'template-1',
      name: 'Test Template',
      description: 'Template description',
      schema: {
        type: 'object',
        properties: {
          field1: { type: 'string', title: 'Field 1' },
          field2: { type: 'string', title: 'Field 2' },
        },
      },
    },
    client: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    comments: [
      {
        id: 'comment-1',
        content: 'Test comment',
        createdAt: new Date('2024-01-01'),
        user: { name: 'Jane Doe' },
      },
    ],
    attachments: [
      {
        id: 'attachment-1',
        originalName: 'file.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageKey: 'key-1',
        createdAt: new Date('2024-01-01'),
        user: { name: 'Jane Doe' },
      },
    ],
    collaborations: [
      {
        id: 'collab-1',
        userId: 'user-2',
        permission: 'EDIT',
        user: { name: 'Collaborator' },
      },
    ],
  };

  const mockPrismaService = {
    briefing: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
    collaboration: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockI18nService = {
    translate: jest.fn((key: string, options?: any) => {
      const translations: Record<string, string> = {
        'EXPORTS.CLIENT': 'Cliente',
        'EXPORTS.STATUS': 'Status',
        'EXPORTS.PROGRESS': 'Progresso',
        'EXPORTS.CREATED_AT': 'Criado em',
        'EXPORTS.ANSWERS': 'Respostas',
        'EXPORTS.SUMMARY': 'Resumo',
        'EXPORTS.COMPLETED_FIELDS': `Campos preenchidos: ${options?.args?.count || 0}`,
        'EXPORTS.COMMENTS': 'Comentários',
        'EXPORTS.ATTACHMENTS': 'Anexos',
        'EXPORTS.UPLOADED_BY': 'Enviado por',
        'BRIEFS.NOT_FOUND': 'Brief não encontrado',
        'BRIEFS.ACCESS_DENIED': 'Acesso negado a este brief',
      };
      return translations[key] || key;
    }),
  };

  const mockStorageProvider = {
    download: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: I18nService, useValue: mockI18nService },
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
      ],
    }).compile();

    service = module.get<ExportsService>(ExportsService);
    prismaService = module.get<PrismaService>(PrismaService);
    i18nService = module.get<I18nService>(I18nService);
    storageProvider = module.get<IStorageProvider>(STORAGE_PROVIDER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportBriefing', () => {
    it('should export briefing as JSON', async () => {
      mockPrismaService.briefing.findFirst.mockResolvedValue(mockBriefing);
      mockPrismaService.membership.findFirst.mockResolvedValue({ id: 'membership-1' });
      mockPrismaService.collaboration.findUnique.mockResolvedValue(null);

      const result = await service.exportBriefing(
        'briefing-1',
        'tenant-1',
        'user-1',
        ExportFormat.JSON,
        { includeAttachments: true, includeComments: true },
        'pt',
      );

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toContain('.json');
      expect(result.mimeType).toBe('application/json');

      const data = JSON.parse(result.buffer.toString('utf-8'));
      expect(data.id).toBe('briefing-1');
      expect(data.answers).toEqual(mockBriefing.answersJson);
    });

    it('should throw NotFoundException if briefing not found', async () => {
      mockPrismaService.briefing.findFirst.mockResolvedValue(null);

      await expect(
        service.exportBriefing(
          'briefing-1',
          'tenant-1',
          'user-1',
          ExportFormat.JSON,
          {},
          'pt',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      mockPrismaService.briefing.findFirst.mockResolvedValue(mockBriefing);
      mockPrismaService.membership.findFirst.mockResolvedValue(null);
      mockPrismaService.collaboration.findUnique.mockResolvedValue(null);

      await expect(
        service.exportBriefing(
          'briefing-1',
          'tenant-1',
          'user-2',
          ExportFormat.JSON,
          {},
          'pt',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getBriefingForExport', () => {
    it('should return briefing with all relations', async () => {
      mockPrismaService.briefing.findFirst.mockResolvedValue(mockBriefing);
      mockPrismaService.membership.findFirst.mockResolvedValue({ id: 'membership-1' });
      mockPrismaService.collaboration.findUnique.mockResolvedValue(null);

      const result = await service['getBriefingForExport']('briefing-1', 'tenant-1', 'user-1', 'pt');

      expect(result).toEqual(mockBriefing);
      expect(mockPrismaService.briefing.findFirst).toHaveBeenCalledWith({
        where: { id: 'briefing-1', tenantId: 'tenant-1' },
        include: expect.objectContaining({
          template: expect.any(Object),
          client: expect.any(Object),
          comments: expect.any(Object),
          attachments: expect.any(Object),
          collaborations: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException if briefing not found', async () => {
      mockPrismaService.briefing.findFirst.mockResolvedValue(null);

      await expect(
        service['getBriefingForExport']('briefing-1', 'tenant-1', 'user-1', 'pt'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateBriefingAccess', () => {
    it('should allow access to client owner', async () => {
      mockPrismaService.membership.findFirst.mockResolvedValue(null);
      mockPrismaService.collaboration.findUnique.mockResolvedValue(null);

      await expect(
        service['validateBriefingAccess'](mockBriefing as any, 'tenant-1', 'user-1', 'pt'),
      ).resolves.not.toThrow();
    });

    it('should allow access to tenant member', async () => {
      mockPrismaService.membership.findFirst.mockResolvedValue({ id: 'membership-1' });
      mockPrismaService.collaboration.findUnique.mockResolvedValue(null);

      await expect(
        service['validateBriefingAccess'](mockBriefing as any, 'tenant-1', 'user-2', 'pt'),
      ).resolves.not.toThrow();
    });

    it('should allow access to collaborator', async () => {
      mockPrismaService.membership.findFirst.mockResolvedValue(null);
      mockPrismaService.collaboration.findUnique.mockResolvedValue({ id: 'collab-1' });

      await expect(
        service['validateBriefingAccess'](mockBriefing as any, 'tenant-1', 'user-2', 'pt'),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException if no access', async () => {
      mockPrismaService.membership.findFirst.mockResolvedValue(null);
      mockPrismaService.collaboration.findUnique.mockResolvedValue(null);

      await expect(
        service['validateBriefingAccess'](mockBriefing as any, 'tenant-1', 'user-3', 'pt'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('generateJSON', () => {
    it('should generate JSON with all data', async () => {
      const result = await service['generateJSON'](mockBriefing as any, {
        includeComments: true,
        includeAttachments: true,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toContain('.json');
      expect(result.mimeType).toBe('application/json');

      const data = JSON.parse(result.buffer.toString('utf-8'));
      expect(data.id).toBe('briefing-1');
      expect(data.comments).toHaveLength(1);
      expect(data.attachments).toHaveLength(1);
    });

    it('should generate JSON without comments and attachments', async () => {
      const result = await service['generateJSON'](mockBriefing as any, {
        includeComments: false,
        includeAttachments: false,
      });

      const data = JSON.parse(result.buffer.toString('utf-8'));
      expect(data.comments).toBeUndefined();
      expect(data.attachments).toBeUndefined();
    });
  });

  describe('formatAnswer', () => {
    it('should format array values', () => {
      const result = service['formatAnswer'](['a', 'b', 'c']);
      expect(result).toBe('a, b, c');
    });

    it('should format object values', () => {
      const result = service['formatAnswer']({ key: 'value' });
      expect(result).toContain('key');
      expect(result).toContain('value');
    });

    it('should format primitive values', () => {
      expect(service['formatAnswer']('text')).toBe('text');
      expect(service['formatAnswer'](123)).toBe('123');
      expect(service['formatAnswer'](true)).toBe('true');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(service['formatBytes'](100)).toBe('100 Bytes');
      expect(service['formatBytes'](1024)).toBe('1 KB');
      expect(service['formatBytes'](1048576)).toBe('1 MB');
      expect(service['formatBytes'](1073741824)).toBe('1 GB');
    });
  });
});
