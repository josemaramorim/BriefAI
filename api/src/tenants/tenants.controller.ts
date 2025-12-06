import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateTenantLimitsDto } from './dto/update-tenant-limits.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  list() {
    return this.tenantsService.findManyWithUsage?.() ?? this.tenantsService.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Post(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  pause(@Param('id') id: string) {
    return this.tenantsService.pause(id);
  }

  @Post(':id/unpause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  unpause(@Param('id') id: string) {
    return this.tenantsService.update(id, { status: 'ACTIVE' } as any);
  }

  @Post(':id/adjust-limits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  adjustLimits(@Param('id') id: string, @Body() dto: UpdateTenantLimitsDto) {
    return this.tenantsService.update(id, { limitsOverride: dto.limitsOverride } as any);
  }
}
