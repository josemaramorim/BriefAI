import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/app-config')
@UseGuards(JwtAuthGuard)
export class AppConfigController {
  constructor(private readonly appConfig: AppConfigService) {}

  @Get()
  async getAllConfigs() {
    return this.appConfig.getAllConfigs();
  }

  @Get('warning-days')
  async getWarningDays() {
    const days = await this.appConfig.getWarningDays();
    return { warning_days: days };
  }

  @Put('warning-days')
  async setWarningDays(@Body() body: { value: number }) {
    await this.appConfig.setWarningDays(body.value);
    return { success: true, warning_days: body.value };
  }

  @Put(':key')
  async setConfig(@Param('key') key: string, @Body() body: { value: string }) {
    await this.appConfig.setConfig(key, body.value);
    return { success: true, key, value: body.value };
  }
}
