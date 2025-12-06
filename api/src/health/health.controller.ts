import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantActiveGuard } from '../tenant/tenant.guard';
import { Tenant } from '../tenant/tenant.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @UseGuards(TenantActiveGuard)
  ping(@Tenant() tenant: any) {
    return { status: 'ok', ts: new Date().toISOString(), tenant: tenant?.slug };
  }
}
