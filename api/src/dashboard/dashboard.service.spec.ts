import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    briefing: {
      count: jest.fn(),
    },
    template: {
      count: jest.fn(),
    },
    collaboration: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    attachment: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return aggregated metrics for a tenant', async () => {
      const tenantId = 'tenant-1';

      // Mock briefing counts
      (mockPrismaService.briefing.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // in_progress
        .mockResolvedValueOnce(5) // completed
        .mockResolvedValueOnce(2); // draft

      // Mock template counts
      (mockPrismaService.template.count as jest.Mock)
        .mockResolvedValueOnce(8) // total
        .mockResolvedValueOnce(5) // published
        .mockResolvedValueOnce(3); // draft

      // Mock collaboration counts
      (mockPrismaService.collaboration.count as jest.Mock).mockResolvedValueOnce(15);
      (mockPrismaService.collaboration.groupBy as jest.Mock).mockResolvedValueOnce([
        { userId: 'user-1', _count: { userId: 1 } },
        { userId: 'user-2', _count: { userId: 1 } },
        { userId: 'user-3', _count: { userId: 1 } },
      ]);

      // Mock attachment metrics
      (mockPrismaService.attachment.count as jest.Mock).mockResolvedValueOnce(25);
      (mockPrismaService.attachment.aggregate as jest.Mock).mockResolvedValueOnce({
        _sum: { size: 1024000 },
      });

      const result = await service.getMetrics(tenantId);

      expect(result).toEqual({
        briefings: {
          total: 10,
          inProgress: 3,
          completed: 5,
          draft: 2,
        },
        templates: {
          total: 8,
          published: 5,
          draft: 3,
        },
        collaborations: {
          totalCollaborators: 15,
          activeCollaborators: 3,
        },
        storage: {
          totalAttachments: 25,
          totalSize: 1024000,
        },
      });

      expect(mockPrismaService.briefing.count).toHaveBeenCalledTimes(4);
      expect(mockPrismaService.template.count).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.collaboration.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.collaboration.groupBy).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.attachment.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.attachment.aggregate).toHaveBeenCalledTimes(1);
    });

    it('should handle zero size when no attachments exist', async () => {
      const tenantId = 'tenant-1';

      // Mock with zeros
      (mockPrismaService.briefing.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      (mockPrismaService.template.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      (mockPrismaService.collaboration.count as jest.Mock).mockResolvedValueOnce(0);
      (mockPrismaService.collaboration.groupBy as jest.Mock).mockResolvedValueOnce([]);

      (mockPrismaService.attachment.count as jest.Mock).mockResolvedValueOnce(0);
      (mockPrismaService.attachment.aggregate as jest.Mock).mockResolvedValueOnce({
        _sum: { size: null },
      });

      const result = await service.getMetrics(tenantId);

      expect(result.storage.totalSize).toBe(0);
      expect(result.storage.totalAttachments).toBe(0);
    });
  });
});
