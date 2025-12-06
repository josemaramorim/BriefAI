import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';

@Injectable()
export class TenantActiveGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;
    if (!tenant) throw new ForbiddenException('Tenant não resolvido');
    if (tenant.status !== TenantStatus.ACTIVE) throw new ForbiddenException('Tenant está pausado');
    return true;
  }
}
