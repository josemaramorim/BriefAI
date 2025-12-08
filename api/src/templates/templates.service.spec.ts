import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  const prismaMock = {
    template: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    templateVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as any;

  const i18nMock = {
    translate: jest.fn().mockImplementation((key: string) => Promise.resolve(key)),
  } as any;

  const service = new TemplatesService(prismaMock, i18nMock);

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns templates (public + owned)', async () => {
      prismaMock.template.findMany.mockResolvedValueOnce([
        { id: '1', title: 'T1', isPublic: true },
        { id: '2', title: 'T2', ownerId: 'user1' },
      ]);
      const res = await service.findAll('tenant1', 'user1');
      expect(res).toHaveLength(2);
      expect(prismaMock.template.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant1',
            OR: expect.arrayContaining([
              { isPublic: true },
              { ownerId: 'user1' },
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns template when found', async () => {
      prismaMock.template.findFirst.mockResolvedValueOnce({ id: '1', title: 'T1' });
      const res = await service.findOne('1', 'tenant1', 'user1');
      expect(res.id).toBe('1');
    });

    it('throws when template not found', async () => {
      prismaMock.template.findFirst.mockResolvedValueOnce(null);
      await expect(service.findOne('missing', 'tenant1', 'user1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates template with valid schema', async () => {
      const dto = { title: 'New', jsonSchema: { type: 'object' } };
      prismaMock.template.create.mockResolvedValueOnce({ id: '1', ...dto });
      const res = await service.create(dto, 'tenant1', 'user1');
      expect(res.id).toBe('1');
      expect(prismaMock.template.create).toHaveBeenCalled();
    });

    it('throws when schema is invalid', async () => {
      const dto = { title: 'Bad', jsonSchema: { type: 'invalid-type' } };
      await expect(service.create(dto, 'tenant1', 'user1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates template and creates version when schema changes', async () => {
      prismaMock.template.findFirst.mockResolvedValueOnce({ id: '1', ownerId: 'user1', version: 1, jsonSchema: { type: 'object' } });
      prismaMock.templateVersion.create.mockResolvedValueOnce({});
      prismaMock.template.update.mockResolvedValueOnce({ id: '1', version: 2 });
      
      const dto = { jsonSchema: { type: 'object', properties: { name: { type: 'string' } } } };
      const res = await service.update('1', dto, 'tenant1', 'user1');
      
      expect(prismaMock.templateVersion.create).toHaveBeenCalled();
      expect(res.version).toBe(2);
    });

    it('throws when user is not owner', async () => {
      prismaMock.template.findFirst.mockResolvedValueOnce({ id: '1', ownerId: 'other' });
      await expect(service.update('1', {}, 'tenant1', 'user1')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('publish', () => {
    it('updates template visibility', async () => {
      prismaMock.template.findFirst.mockResolvedValueOnce({ id: '1', ownerId: 'user1' });
      prismaMock.template.update.mockResolvedValueOnce({ id: '1', isPublic: true });
      const res = await service.publish('1', true, 'tenant1', 'user1');
      expect(res.isPublic).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes template when user is owner', async () => {
      prismaMock.template.findFirst.mockResolvedValueOnce({ id: '1', ownerId: 'user1' });
      prismaMock.template.delete.mockResolvedValueOnce({ id: '1' });
      await service.delete('1', 'tenant1', 'user1');
      expect(prismaMock.template.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('listVersions', () => {
    it('returns template versions', async () => {
      prismaMock.template.findFirst.mockResolvedValueOnce({ id: '1' });
      prismaMock.templateVersion.findMany.mockResolvedValueOnce([
        { version: 2, jsonSchema: {} },
        { version: 1, jsonSchema: {} },
      ]);
      const res = await service.listVersions('1', 'tenant1', 'user1');
      expect(res).toHaveLength(2);
    });
  });
});
