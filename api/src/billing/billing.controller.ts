import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upgrade')
  async upgradePlan(@Req() req: any, @Body() body: { plan: string }) {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    return this.billingService.upgradePlan(tenantId, body.plan);
  }
}
