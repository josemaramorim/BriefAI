import { TenantActiveGuard } from './tenant.guard';
import { ExecutionContext } from '@nestjs/common';

describe('TenantActiveGuard', () => {
  let guard: TenantActiveGuard;

  beforeEach(() => {
    guard = new TenantActiveGuard();
  });

  function makeContext(tenant: any): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ tenant }) }),
    } as any;
  }

  it('should allow active tenant', () => {
    const ctx = makeContext({ status: 'ACTIVE' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should forbid paused tenant', () => {
    const ctx = makeContext({ status: 'PAUSED' });
    expect(() => guard.canActivate(ctx)).toThrow();
  });
});
