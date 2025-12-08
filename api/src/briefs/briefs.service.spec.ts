import { Test, TestingModule } from '@nestjs/testing';
import { BriefsService } from './briefs.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { BriefingStatus } from '@prisma/client';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('BriefsService', () => {
  let service: BriefsService;
  let prisma: PrismaService;
  let i18n: I18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BriefsService,
        {
          provide: PrismaService,
          useValue: {
            briefing: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            template: { findFirst: jest.fn() },
            user: { findUnique: jest.fn() },
            membership: { findFirst: jest.fn() },
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

    service = module.get<BriefsService>(BriefsService);
    prisma = module.get<PrismaService>(PrismaService);
    i18n = module.get<I18nService>(I18nService);
  });

  describe('findAll', () => {
    it('should return all briefs for tenant', async () => {
      const briefs = [{ id: '1', tenantId: 'tenant1', status: BriefingStatus.DRAFT }];
      jest.spyOn(prisma.briefing, 'findMany').mockResolvedValue(briefs as any);

      const result = await service.findAll('tenant1');
      expect(result).toEqual(briefs);
      expect(prisma.briefing.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1' },
        include: {
          template: { select: { id: true, title: true } },
          client: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should filter by status', async () => {
      jest.spyOn(prisma.briefing, 'findMany').mockResolvedValue([]);
      
      await service.findAll('tenant1', undefined, BriefingStatus.IN_PROGRESS);
      
      expect(prisma.briefing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: BriefingStatus.IN_PROGRESS }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a brief by id', async () => {
      const brief = { id: '1', tenantId: 'tenant1', clientId: 'user1' };
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: '1' } as any);

      const result = await service.findOne('1', 'tenant1', 'user1');
      expect(result).toEqual(brief);
    });

    it('should throw NotFoundException if brief not found', async () => {
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('1', 'tenant1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const brief = { id: '1', tenantId: 'tenant1', clientId: 'user2' };
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne('1', 'tenant1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create a brief with valid data', async () => {
      const dto = {
        templateId: 'template1',
        answersJson: { projectName: 'Test Project' },
      };
      const template = {
        id: 'template1',
        jsonSchema: {
          type: 'object',
          properties: { projectName: { type: 'string' } },
        },
      };
      const brief = { id: '1', ...dto, tenantId: 'tenant1' };

      jest.spyOn(prisma.template, 'findFirst').mockResolvedValue(template as any);
      jest.spyOn(prisma.briefing, 'create').mockResolvedValue(brief as any);

      const result = await service.create(dto, 'tenant1', 'user1');
      
      expect(result).toEqual(brief);
      expect(prisma.briefing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant1',
            templateId: 'template1',
            answersJson: dto.answersJson,
            status: BriefingStatus.DRAFT,
          }),
        }),
      );
    });

    it('should throw NotFoundException if template not found', async () => {
      jest.spyOn(prisma.template, 'findFirst').mockResolvedValue(null);

      await expect(
        service.create({ templateId: 'invalid' }, 'tenant1', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid answers', async () => {
      const template = {
        id: 'template1',
        jsonSchema: {
          type: 'object',
          properties: { required: { type: 'string' } },
          required: ['required'],
        },
      };
      jest.spyOn(prisma.template, 'findFirst').mockResolvedValue(template as any);

      await expect(
        service.create(
          { templateId: 'template1', answersJson: {} },
          'tenant1',
          'user1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a brief', async () => {
      const brief = {
        id: '1',
        tenantId: 'tenant1',
        clientId: 'user1',
        template: { jsonSchema: { type: 'object', properties: {} } },
      };
      const updated = { ...brief, status: BriefingStatus.IN_PROGRESS };

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.briefing, 'update').mockResolvedValue(updated as any);

      const result = await service.update(
        '1',
        { status: BriefingStatus.IN_PROGRESS },
        'tenant1',
        'user1',
      );

      expect(result).toEqual(updated);
    });

    it('should throw ForbiddenException if user cannot update', async () => {
      const brief = { id: '1', tenantId: 'tenant1', clientId: 'user2', template: {} };
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);

      await expect(
        service.update('1', { status: BriefingStatus.COMPLETED }, 'tenant1', 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete a brief', async () => {
      const brief = { id: '1', tenantId: 'tenant1' };
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.briefing, 'delete').mockResolvedValue(brief as any);

      const result = await service.delete('1', 'tenant1', 'user1');
      
      expect(result.message).toBeDefined();
      expect(prisma.briefing.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw ForbiddenException if user is not tenant member', async () => {
      const brief = { id: '1', tenantId: 'tenant1' };
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);

      await expect(service.delete('1', 'tenant1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });
});
