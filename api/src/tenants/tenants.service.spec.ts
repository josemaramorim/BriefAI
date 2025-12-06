import { NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  const prismaMock = {
    tenant: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1' }),
      update: jest.fn().mockResolvedValue({ id: '1' }),
    },
  } as any;

  const service = new TenantsService(prismaMock as any);

  beforeEach(() => jest.clearAllMocks());

  it('findAll returns array', async () => {
    prismaMock.tenant.findMany.mockResolvedValueOnce([{ id: '1' }]);
    const res = await service.findAll();
    expect(res).toEqual([{ id: '1' }]);
  });

  it('findOne throws when missing', async () => {
    prismaMock.tenant.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create calls prisma.create', async () => {
    const dto = { name: 'T', slug: 't' } as any;
    await service.create(dto);
    expect(prismaMock.tenant.create).toHaveBeenCalled();
  });
});
