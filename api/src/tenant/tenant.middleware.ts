import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Resolve tenant by header x-tenant or subdomain
    const requestPath = req.path || '';
    const isAuthPath = requestPath.startsWith('/auth');
    const tenantSlug = (req.headers['x-tenant'] as string) || getSubdomain(req.hostname);

    if (!tenantSlug) {
      if (isAuthPath) {
        return next();
      }
      throw new BadRequestException('Tenant não informado');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      if (isAuthPath) {
        return next();
      }
      throw new BadRequestException('Tenant não encontrado');
    }

    (req as any).tenant = tenant;
    next();
  }
}

function getSubdomain(hostname: string): string | null {
  // Ex: demo.briefai.com -> demo
  const parts = hostname.split('.');
  if (parts.length > 2) return parts[0];
  return null;
}
