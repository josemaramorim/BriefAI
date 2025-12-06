import { UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResponse } from './interfaces/auth-response.interface';

const mockResponse = (overrides: Partial<AuthResponse> = {}): AuthResponse => ({
  accessToken: 'token',
  user: {
    id: 'user',
    name: 'User',
    email: 'user@brief.ai',
    locale: 'pt-BR',
    role: UserRole.CLIENT,
    tenantId: 'tenant',
    tenantSlug: 'tenant',
    membershipRole: null,
  },
  ...overrides,
});

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
    register: jest.fn(),
  } as unknown as AuthService;

  const controller = new AuthController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates login to service and forwards tenant', async () => {
    (authService.login as jest.Mock).mockResolvedValue(mockResponse());
    const dto = { email: 'user@brief.ai', password: '123456' } as any;
    const req = { tenant: { id: 'tenant-id' } } as any;

    const response = await controller.login(dto, req);

    expect(authService.login).toHaveBeenCalledWith(dto, req.tenant);
    expect(response.accessToken).toBe('token');
  });

  it('delegates register to service', async () => {
    (authService.register as jest.Mock).mockResolvedValue(mockResponse());
    const dto = { name: 'User', email: 'user@brief.ai', password: 'P@ssw0rd!' } as any;
    const req = { tenant: { id: 'tenant-id' } } as any;

    const response = await controller.register(dto, req);

    expect(authService.register).toHaveBeenCalledWith(dto, req.tenant);
    expect(response.user.email).toBe('user@brief.ai');
  });

  it('returns current user on /me', () => {
    const user = mockResponse().user;
    expect(controller.me(user)).toEqual(user);
  });

  it('returns ok message on super admin ping', () => {
    expect(controller.superAdminPing()).toEqual({ message: 'ok' });
  });
});
