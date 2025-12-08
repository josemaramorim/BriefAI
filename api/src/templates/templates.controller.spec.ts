import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { UserRole } from '@prisma/client';

describe('TemplatesController', () => {
  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    delete: jest.fn(),
    listVersions: jest.fn(),
  };

  const controller = new TemplatesController(mockService as any);
  const mockUser = {
    id: 'user1',
    email: 'user@test.com',
    name: 'Test User',
    role: UserRole.ARCHITECT,
    tenantId: 'tenant1',
    tenantSlug: 'test-tenant',
    locale: 'pt-BR',
    membershipRole: 'ARCHITECT' as any,
  };
  const mockI18n = { lang: 'pt' } as any;

  beforeEach(() => jest.clearAllMocks());

  it('list calls service.findAll', async () => {
    mockService.findAll.mockResolvedValueOnce([{ id: '1' }]);
    const res = await controller.list('tenant1', mockUser);
    expect(res).toHaveLength(1);
    expect(mockService.findAll).toHaveBeenCalledWith('tenant1', 'user1');
  });

  it('get calls service.findOne', async () => {
    mockService.findOne.mockResolvedValueOnce({ id: '1' });
    const res = await controller.get('1', 'tenant1', mockUser, mockI18n);
    expect(res.id).toBe('1');
    expect(mockService.findOne).toHaveBeenCalledWith('1', 'tenant1', 'user1', 'pt');
  });

  it('create calls service.create', async () => {
    const dto = { title: 'New', jsonSchema: { type: 'object' } };
    mockService.create.mockResolvedValueOnce({ id: '1', ...dto });
    const res = await controller.create(dto, 'tenant1', mockUser);
    expect(res.id).toBe('1');
    expect(mockService.create).toHaveBeenCalledWith(dto, 'tenant1', 'user1');
  });

  it('update calls service.update', async () => {
    const dto = { title: 'Updated' };
    mockService.update.mockResolvedValueOnce({ id: '1', ...dto });
    const res = await controller.update('1', dto, 'tenant1', mockUser, mockI18n);
    expect(res.title).toBe('Updated');
  });

  it('publish calls service.publish', async () => {
    mockService.publish.mockResolvedValueOnce({ id: '1', isPublic: true });
    const res = await controller.publish('1', { isPublic: true }, 'tenant1', mockUser, mockI18n);
    expect(res.isPublic).toBe(true);
  });

  it('delete calls service.delete', async () => {
    mockService.delete.mockResolvedValueOnce({ id: '1' });
    await controller.delete('1', 'tenant1', mockUser, mockI18n);
    expect(mockService.delete).toHaveBeenCalledWith('1', 'tenant1', 'user1', 'pt');
  });

  it('versions calls service.listVersions', async () => {
    mockService.listVersions.mockResolvedValueOnce([{ version: 1 }]);
    const res = await controller.versions('1', 'tenant1', mockUser, mockI18n);
    expect(res).toHaveLength(1);
  });
});
