import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BriefingStatus } from '@prisma/client';
import { BriefsService } from './briefs.service';
import { CreateBriefDto } from './dto/create-brief.dto';
import { UpdateBriefDto } from './dto/update-brief.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Tenant } from '../tenant/tenant.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('briefs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('briefs')
export class BriefsController {
  constructor(private readonly briefsService: BriefsService) {}

  @Get()
  @ApiOperation({ summary: 'List all briefs' })
  @ApiResponse({ status: 200, description: 'Briefs list' })
  @ApiQuery({ name: 'status', enum: BriefingStatus, required: false })
  @ApiQuery({ name: 'templateId', type: String, required: false })
  findAll(
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Query('status') status?: BriefingStatus,
    @Query('templateId') templateId?: string,
  ) {
    return this.briefsService.findAll(tenantId, user.id, status, templateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brief by ID' })
  @ApiResponse({ status: 200, description: 'Brief found' })
  @ApiResponse({ status: 404, description: 'Brief not found' })
  findOne(
    @Param('id') id: string,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.briefsService.findOne(id, tenantId, user.id, i18n.lang);
  }

  @Post()
  @ApiOperation({ summary: 'Create new brief' })
  @ApiResponse({ status: 201, description: 'Brief created' })
  @ApiResponse({ status: 400, description: 'Invalid data or template not found' })
  create(
    @Body() dto: CreateBriefDto,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.briefsService.create(dto, tenantId, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update brief' })
  @ApiResponse({ status: 200, description: 'Brief updated' })
  @ApiResponse({ status: 404, description: 'Brief not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBriefDto,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.briefsService.update(id, dto, tenantId, user.id, i18n.lang);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete brief' })
  @ApiResponse({ status: 200, description: 'Brief deleted' })
  @ApiResponse({ status: 404, description: 'Brief not found' })
  @ApiResponse({ status: 403, description: 'Only tenant members can delete' })
  delete(
    @Param('id') id: string,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.briefsService.delete(id, tenantId, user.id, i18n.lang);
  }
}
