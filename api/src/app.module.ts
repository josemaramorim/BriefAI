import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { TenantMiddleware } from './tenant/tenant.middleware';

@Module({
  imports: [PrismaModule, HealthModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
