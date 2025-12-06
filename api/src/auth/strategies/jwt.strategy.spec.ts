import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const strategy = new JwtStrategy(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns AuthUser when user exists', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      name: 'User',
      email: 'user@brief.ai',
      role: UserRole.CLIENT,
      locale: 'pt-BR',
    });

    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'user@brief.ai',
      role: UserRole.CLIENT,
      tenantId: 'tenant',
      tenantSlug: 'tenant',
      membershipRole: null,
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 'user-1',
      name: 'User',
      email: 'user@brief.ai',
      role: UserRole.CLIENT,
      locale: 'pt-BR',
      tenantId: 'tenant',
      tenantSlug: 'tenant',
      membershipRole: null,
    });
  });

  it('throws UnauthorizedException when user is not found', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);

    const payload: JwtPayload = {
      sub: 'missing',
      email: 'missing@brief.ai',
      role: UserRole.CLIENT,
      tenantId: null,
      tenantSlug: null,
      membershipRole: null,
    };

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
