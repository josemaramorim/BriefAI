import { TenantMiddleware } from './tenant.middleware';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  const mockPrisma: Partial<PrismaService> = {
    tenant: {
      findUnique: jest.fn(),
    } as any,
  } as any;

  beforeEach(() => {
    middleware = new TenantMiddleware(mockPrisma as PrismaService);
  });

  it('should throw if tenant not provided', async () => {
    const req: any = { headers: {}, hostname: 'localhost' };
    const res: any = {};
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toBeDefined();
  });

  it('should resolve tenant by header', async () => {
    ((mockPrisma as any).tenant.findUnique as jest.Mock).mockResolvedValue({ id: 't1', slug: 'demo' });
    const req: any = { headers: { 'x-tenant': 'demo' }, hostname: 'localhost' };
    const res: any = {};
    const next = jest.fn();
    await middleware.use(req, res, next as any);
    expect(req.tenant).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});
