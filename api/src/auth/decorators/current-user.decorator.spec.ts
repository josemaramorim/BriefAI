import { ExecutionContext } from '@nestjs/common';
import { getCurrentUserFromContext } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  it('returns user from request context', () => {
    const user = { id: 'user-1' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    const result = getCurrentUserFromContext(ctx);

    expect(result).toBe(user);
  });

  it('returns undefined when request has no user', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(getCurrentUserFromContext(ctx)).toBeUndefined();
  });
});
