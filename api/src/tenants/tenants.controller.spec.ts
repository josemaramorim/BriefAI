import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

describe('TenantsController', () => {
  const serviceMock = {
    findAll: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: '1' }),
    update: jest.fn().mockResolvedValue({ id: '1' }),
    pause: jest.fn().mockResolvedValue({ id: '1' }),
  } as any;

  const controller = new TenantsController(serviceMock as TenantsService);

  beforeEach(() => jest.clearAllMocks());

  it('list delegates to service', async () => {
    await controller.list();
    expect(serviceMock.findAll).toHaveBeenCalled();
  });

  it('create delegates to service', async () => {
    await controller.create({ name: 'x', slug: 'x' } as any);
    expect(serviceMock.create).toHaveBeenCalled();
  });
});
