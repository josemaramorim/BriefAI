import { Test, TestingModule } from '@nestjs/testing';
import { BriefsController } from './briefs.controller';
import { BriefsService } from './briefs.service';
import { BriefingStatus } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

describe('BriefsController', () => {
  let controller: BriefsController;
  let service: BriefsService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BriefsController],
      providers: [
        {
          provide: BriefsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BriefsController>(BriefsController);
    service = module.get<BriefsService>(BriefsService);
  });

  describe('findAll', () => {
    it('should call service.findAll with correct params', async () => {
      const briefs = [{ id: '1', status: BriefingStatus.DRAFT }];
      jest.spyOn(service, 'findAll').mockResolvedValue(briefs as any);

      const result = await controller.findAll('tenant123', mockAuthUser);

      expect(service.findAll).toHaveBeenCalledWith('tenant123', 'user123', undefined, undefined);
      expect(result).toEqual(briefs);
    });

    it('should pass status filter', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      await controller.findAll('tenant123', mockAuthUser, BriefingStatus.IN_PROGRESS);

      expect(service.findAll).toHaveBeenCalledWith(
        'tenant123',
        'user123',
        BriefingStatus.IN_PROGRESS,
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with correct params', async () => {
      const brief = { id: '1' };
      jest.spyOn(service, 'findOne').mockResolvedValue(brief as any);

      const result = await controller.findOne('1', 'tenant123', mockAuthUser, mockI18nContext as any);

      expect(service.findOne).toHaveBeenCalledWith('1', 'tenant123', 'user123', 'pt');
      expect(result).toEqual(brief);
    });
  });

  describe('create', () => {
    it('should call service.create with correct params', async () => {
      const dto = { templateId: 'template1', answersJson: {} };
      const brief = { id: '1', ...dto };
      jest.spyOn(service, 'create').mockResolvedValue(brief as any);

      const result = await controller.create(dto, 'tenant123', mockAuthUser);

      expect(service.create).toHaveBeenCalledWith(dto, 'tenant123', 'user123');
      expect(result).toEqual(brief);
    });
  });

  describe('update', () => {
    it('should call service.update with correct params', async () => {
      const dto = { status: BriefingStatus.COMPLETED };
      const brief = { id: '1', status: BriefingStatus.COMPLETED };
      jest.spyOn(service, 'update').mockResolvedValue(brief as any);

      const result = await controller.update('1', dto, 'tenant123', mockAuthUser, mockI18nContext as any);

      expect(service.update).toHaveBeenCalledWith('1', dto, 'tenant123', 'user123', 'pt');
      expect(result).toEqual(brief);
    });
  });

  describe('delete', () => {
    it('should call service.delete with correct params', async () => {
      const response = { message: 'Brief deleted' };
      jest.spyOn(service, 'delete').mockResolvedValue(response);

      const result = await controller.delete('1', 'tenant123', mockAuthUser, mockI18nContext as any);

      expect(service.delete).toHaveBeenCalledWith('1', 'tenant123', 'user123', 'pt');
      expect(result).toEqual(response);
    });
  });
});
