import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { MetricsDto } from './dto/metrics.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard metrics for a tenant' })
  @ApiQuery({
    name: 'tenantId',
    required: true,
    description: 'The ID of the tenant to get metrics for',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
  })
  async getMetrics(@Query('tenantId') tenantId: string): Promise<MetricsDto> {
    // In a real app, tenantId would come from auth/session, here it's a query param for demo
    const metrics = await this.dashboardService.getMetrics(tenantId);
    return metrics;
  }
}
