import { Test, TestingModule } from '@nestjs/testing';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { ExportFormat } from './dto/export-briefing.dto';
import { Response } from 'express';

describe('ExportsController', () => {
  let controller: ExportsController;
  let exportsService: ExportsService;

  const mockExportsService = {
    exportBriefing: jest.fn(),
  };

  const mockResponse = {
    set: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportsController],
      providers: [{ provide: ExportsService, useValue: mockExportsService }],
    }).compile();

    controller = module.get<ExportsController>(ExportsController);
    exportsService = module.get<ExportsService>(ExportsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportBriefing', () => {
    const mockExportResult = {
      buffer: Buffer.from('test content'),
      filename: 'test.pdf',
      mimeType: 'application/pdf',
    };

    const mockI18nContext = {
      lang: 'pt',
    };

    it('should export briefing as PDF', async () => {
      mockExportsService.exportBriefing.mockResolvedValue(mockExportResult);

      await controller.exportBriefing(
        'briefing-1',
        { format: ExportFormat.PDF },
        mockResponse,
        'tenant-1',
        { id: 'user-1' } as any,
        mockI18nContext as any,
      );

      expect(mockExportsService.exportBriefing).toHaveBeenCalledWith(
        'briefing-1',
        'tenant-1',
        'user-1',
        ExportFormat.PDF,
        {
          includeAttachments: undefined,
          includeComments: undefined,
          summarized: undefined,
        },
        'pt',
      );
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
        'Content-Length': mockExportResult.buffer.length,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockExportResult.buffer);
    });

    it('should export briefing as JSON', async () => {
      const jsonResult = {
        buffer: Buffer.from('{"test": "data"}'),
        filename: 'test.json',
        mimeType: 'application/json',
      };
      mockExportsService.exportBriefing.mockResolvedValue(jsonResult);

      await controller.exportBriefing(
        'briefing-1',
        { format: ExportFormat.JSON },
        mockResponse,
        'tenant-1',
        { id: 'user-1' } as any,
        mockI18nContext as any,
      );

      expect(mockExportsService.exportBriefing).toHaveBeenCalledWith(
        'briefing-1',
        'tenant-1',
        'user-1',
        ExportFormat.JSON,
        {
          includeAttachments: undefined,
          includeComments: undefined,
          summarized: undefined,
        },
        'pt',
      );
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="test.json"',
        'Content-Length': jsonResult.buffer.length,
      });
    });

    it('should export briefing as ZIP', async () => {
      const zipResult = {
        buffer: Buffer.from('zip content'),
        filename: 'test.zip',
        mimeType: 'application/zip',
      };
      mockExportsService.exportBriefing.mockResolvedValue(zipResult);

      await controller.exportBriefing(
        'briefing-1',
        { format: ExportFormat.ZIP },
        mockResponse,
        'tenant-1',
        { id: 'user-1' } as any,
        mockI18nContext as any,
      );

      expect(mockExportsService.exportBriefing).toHaveBeenCalledWith(
        'briefing-1',
        'tenant-1',
        'user-1',
        ExportFormat.ZIP,
        {
          includeAttachments: undefined,
          includeComments: undefined,
          summarized: undefined,
        },
        'pt',
      );
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="test.zip"',
        'Content-Length': zipResult.buffer.length,
      });
    });

    it('should handle options correctly', async () => {
      mockExportsService.exportBriefing.mockResolvedValue(mockExportResult);

      await controller.exportBriefing(
        'briefing-1',
        {
          format: ExportFormat.PDF,
          includeComments: false,
          includeAttachments: false,
          summarized: true,
        },
        mockResponse,
        'tenant-1',
        { id: 'user-1' } as any,
        mockI18nContext as any,
      );

      expect(mockExportsService.exportBriefing).toHaveBeenCalledWith(
        'briefing-1',
        'tenant-1',
        'user-1',
        ExportFormat.PDF,
        {
          includeAttachments: false,
          includeComments: false,
          summarized: true,
        },
        'pt',
      );
    });

    it('should use default values when options not provided', async () => {
      mockExportsService.exportBriefing.mockResolvedValue(mockExportResult);

      await controller.exportBriefing(
        'briefing-1',
        {},
        mockResponse,
        'tenant-1',
        { id: 'user-1' } as any,
        mockI18nContext as any,
      );

      expect(mockExportsService.exportBriefing).toHaveBeenCalledWith(
        'briefing-1',
        'tenant-1',
        'user-1',
        ExportFormat.PDF,
        {
          includeAttachments: undefined,
          includeComments: undefined,
          summarized: undefined,
        },
        'pt',
      );
    });
  });
});
