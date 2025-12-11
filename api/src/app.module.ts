import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TemplatesModule } from './templates/templates.module';
import { BriefsModule } from './briefs/briefs.module';
import { AiModule } from './ai/ai.module';
import { CollaborationsModule } from './collaborations/collaborations.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ExportsModule } from './exports/exports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BillingModule } from './billing/billing.module';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { AppConfigController } from './prisma/app-config.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    I18nModule.forRoot({
      fallbackLanguage: 'pt',
      loaderOptions: {
        path: path.join(__dirname, '../src/locales/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale'] },
        AcceptLanguageResolver,
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    TemplatesModule,
    BriefsModule,
    AiModule,
    CollaborationsModule,
    AttachmentsModule,
    ExportsModule,
    DashboardModule,
    BillingModule,
  ],
  controllers: [AppConfigController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
