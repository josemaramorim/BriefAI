import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../interfaces/auth-user.interface';

export const getCurrentUserFromContext = (
  ctx: ExecutionContext,
): AuthUser | undefined => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as AuthUser | undefined;
};

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser | undefined =>
    getCurrentUserFromContext(ctx),
);
