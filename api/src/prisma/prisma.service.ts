import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // PrismaClient $on typings can be strict; cast to any to register lifecycle hook
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
