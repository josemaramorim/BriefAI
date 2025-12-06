import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const getAllAndOverride = jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockReturnValue(undefined);

  const guard = new RolesGuard(reflector);

  const buildContext = (user: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    getAllAndOverride.mockReturnValue(undefined);
  });

  it('allows when no roles are specified', () => {
    expect(guard.canActivate(buildContext({ role: UserRole.CLIENT }))).toBe(true);
  });

  it('allows when user has required role', () => {
    getAllAndOverride.mockReturnValue([UserRole.ARCHITECT]);
    expect(guard.canActivate(buildContext({ role: UserRole.ARCHITECT }))).toBe(true);
  });

  it('allows super admin regardless of requirement', () => {
    getAllAndOverride.mockReturnValue([UserRole.CLIENT]);
    expect(guard.canActivate(buildContext({ role: UserRole.SUPER_ADMIN }))).toBe(true);
  });

  it('throws when user lacks required role', () => {
    getAllAndOverride.mockReturnValue([UserRole.TENANT_ADMIN]);
    expect(() => guard.canActivate(buildContext({ role: UserRole.CLIENT }))).toThrow(
      ForbiddenException,
    );
  });

  it('throws when user is missing', () => {
    getAllAndOverride.mockReturnValue([UserRole.CLIENT]);
    expect(() => guard.canActivate(buildContext({}))).toThrow(ForbiddenException);
  });
});
