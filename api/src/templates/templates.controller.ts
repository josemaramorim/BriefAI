import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { PublishTemplateDto } from './dto/publish-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Tenant } from '../tenant/tenant.decorator';

@ApiTags('templates')
@ApiBearerAuth('access-token')
@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all templates (public + owned)' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  list(@Tenant() tenantId: string, @CurrentUser() user: AuthUser) {
    return this.templatesService.findAll(tenantId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  get(@Param('id') id: string, @Tenant() tenantId: string, @CurrentUser() user: AuthUser, @I18n() i18n: I18nContext) {
    return this.templatesService.findOne(id, tenantId, user.id, i18n.lang);
  }

  @Post()
  @ApiOperation({ summary: 'Create new template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid JSON Schema' })
  create(@Body() dto: CreateTemplateDto, @Tenant() tenantId: string, @CurrentUser() user: AuthUser) {
    return this.templatesService.create(dto, tenantId, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template (owner only)' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 403, description: 'Not the template owner' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @Tenant() tenantId: string, @CurrentUser() user: AuthUser, @I18n() i18n: I18nContext) {
    return this.templatesService.update(id, dto, tenantId, user.id, i18n.lang);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Change template visibility (owner only)' })
  @ApiResponse({ status: 200, description: 'Template visibility updated' })
  @ApiResponse({ status: 403, description: 'Not the template owner' })
  publish(@Param('id') id: string, @Body() dto: PublishTemplateDto, @Tenant() tenantId: string, @CurrentUser() user: AuthUser, @I18n() i18n: I18nContext) {
    return this.templatesService.publish(id, dto.isPublic, tenantId, user.id, i18n.lang);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template (owner only)' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not the template owner' })
  delete(@Param('id') id: string, @Tenant() tenantId: string, @CurrentUser() user: AuthUser, @I18n() i18n: I18nContext) {
    return this.templatesService.delete(id, tenantId, user.id, i18n.lang);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List template versions' })
  @ApiResponse({ status: 200, description: 'Template versions retrieved' })
  versions(@Param('id') id: string, @Tenant() tenantId: string, @CurrentUser() user: AuthUser, @I18n() i18n: I18nContext) {
    return this.templatesService.listVersions(id, tenantId, user.id, i18n.lang);
  }
}
