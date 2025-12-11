import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppConfigService {
  constructor(private prisma: PrismaService) {}

  async getAllConfigs() {
    return this.prisma.appConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async setConfig(key: string, value: string, description?: string): Promise<void> {
    await this.prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        description,
      },
    });
  }

  async getWarningDays(): Promise<number> {
    const config = await this.prisma.appConfig.findUnique({
      where: { key: 'warning_days' },
    });
    if (!config) return 3; // valor padrão
    const value = parseInt(config.value, 10);
    return isNaN(value) ? 3 : value;
  }

  async setWarningDays(value: number): Promise<void> {
    await this.setConfig(
      'warning_days',
      value.toString(),
      'Dias para exibir warning de expiração de trial/renovação',
    );
  }
}
