import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /dashboard/metrics', () => {
    it('should return metrics for a tenant', async () => {
      const tenantId = 'tenant-1';
      const expectedMetrics = {
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
      };

      mockDashboardService.getMetrics.mockResolvedValue(expectedMetrics);

      const result = await controller.getMetrics(tenantId);

      expect(result).toEqual(expectedMetrics);
      expect(mockDashboardService.getMetrics).toHaveBeenCalledWith(tenantId);
      expect(mockDashboardService.getMetrics).toHaveBeenCalledTimes(1);
    });
  });
});
