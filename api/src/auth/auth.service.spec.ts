import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { MembershipRole, Tenant, TenantStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-response.interface';

const createTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 'tenant-id',
  name: 'Tenant',
  slug: 'tenant',
  status: TenantStatus.ACTIVE,
  planId: 'plan',
  trialEndsAt: null,
  limitsOverride: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    membership: {
      create: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn().mockReturnValue('signed-token'),
  };

  const service = new AuthService(prismaMock as never, jwtMock as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.tenant.findUnique.mockResolvedValue(createTenant());
  });

  it('should login super admin without tenant context', async () => {
    const password = await bcrypt.hash('StrongPass#1', 10);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@brief.ai',
      name: 'Admin',
      locale: 'pt-BR',
      role: UserRole.SUPER_ADMIN,
      passwordHash: password,
      memberships: [],
    });

    const response = await service.login(
      { email: 'admin@brief.ai', password: 'StrongPass#1' } as LoginDto,
      null,
    );

    expect(jwtMock.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'admin@brief.ai',
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      tenantSlug: null,
      membershipRole: null,
    });

    expect(response).toMatchObject<AuthResponse>({
      accessToken: 'signed-token',
      user: {
        id: 'user-1',
        name: 'Admin',
        email: 'admin@brief.ai',
        locale: 'pt-BR',
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
        tenantSlug: null,
        membershipRole: null,
      },
    });
  });

  it('should refuse tenant user login without membership', async () => {
    const password = await bcrypt.hash('StrongPass#1', 10);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-2',
      email: 'architect@brief.ai',
      name: 'Architect',
      locale: 'pt-BR',
      role: UserRole.TENANT_ADMIN,
      passwordHash: password,
      memberships: [],
    });

    await expect(
      service.login(
        { email: 'architect@brief.ai', password: 'StrongPass#1' } as LoginDto,
        createTenant(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should register a new tenant user and create membership', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    prismaMock.user.create.mockImplementationOnce(async ({ data }) => ({
      ...data,
      id: 'user-3',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    prismaMock.membership.create.mockImplementationOnce(async ({ data }) => ({
      ...data,
      id: 'membership-1',
      createdAt: new Date(),
    }));

    const tenant = createTenant();
    const dto: RegisterDto = {
      name: 'Client',
      email: 'client@brief.ai',
      password: 'ClientPass#1',
      role: UserRole.CLIENT,
    };

    const response = await service.register(dto, tenant);

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(prismaMock.membership.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: tenant.id,
        role: MembershipRole.CLIENT,
      }),
    });
    expect(response.user.membershipRole).toBe(MembershipRole.CLIENT);
    expect(response.user.tenantId).toBe(tenant.id);
  });

  it('should login tenant admin with valid membership', async () => {
    const tenant = createTenant();
    const password = await bcrypt.hash('AnotherPass#1', 10);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-4',
      email: 'tenant@brief.ai',
      name: 'Tenant Admin',
      locale: 'pt-BR',
      role: UserRole.TENANT_ADMIN,
      passwordHash: password,
      memberships: [
        {
          id: 'membership-2',
          tenantId: tenant.id,
          userId: 'user-4',
          role: MembershipRole.TENANT_ADMIN,
          createdAt: new Date(),
        },
      ],
    });

    const response = await service.login(
      { email: 'tenant@brief.ai', password: 'AnotherPass#1' } as LoginDto,
      tenant,
    );

    expect(response.user.membershipRole).toBe(MembershipRole.TENANT_ADMIN);
    expect(response.user.tenantSlug).toBe(tenant.slug);
  });

  it('should throw when tenant slug is invalid during resolve', async () => {
    prismaMock.tenant.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.login(
        { email: 'x@brief.ai', password: '123456', tenantSlug: 'unknown' } as LoginDto,
        null,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw on wrong password', async () => {
    const password = await bcrypt.hash('RightPass#1', 10);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-5',
      email: 'user@brief.ai',
      name: 'User',
      locale: 'pt-BR',
      role: UserRole.CLIENT,
      passwordHash: password,
      memberships: [],
    });

    await expect(
      service.login(
        { email: 'user@brief.ai', password: 'WrongPass', tenantSlug: 'tenant' } as LoginDto,
        null,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
