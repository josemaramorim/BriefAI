import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { ExportBriefingDto, ExportFormat } from './dto/export-briefing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../tenant/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('exports')
@ApiBearerAuth()
@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('briefings/:id')
  @ApiOperation({ summary: 'Export briefing in multiple formats' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: false, description: 'Export format (pdf, json, zip)' })
  @ApiQuery({ name: 'includeAttachments', type: Boolean, required: false, description: 'Include attachments (for ZIP)' })
  @ApiQuery({ name: 'includeComments', type: Boolean, required: false, description: 'Include comments' })
  @ApiQuery({ name: 'summarized', type: Boolean, required: false, description: 'Summarized version (for PDF)' })
  @ApiResponse({ status: 200, description: 'Briefing exported successfully' })
  @ApiResponse({ status: 404, description: 'Briefing not found' })
  async exportBriefing(
    @Param('id') id: string,
    @Query() dto: ExportBriefingDto,
    @Res() res: Response,
    @Tenant() tenantId: string = '',
    @CurrentUser() user: AuthUser = {} as AuthUser,
    @I18n() i18n: I18nContext = {} as I18nContext,
  ) {
    const { buffer, filename, mimeType } = await this.exportsService.exportBriefing(
      id,
      tenantId,
      user.id,
      dto.format || ExportFormat.PDF,
      {
        includeAttachments: dto.includeAttachments,
        includeComments: dto.includeComments,
        summarized: dto.summarized,
      },
      i18n.lang,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).send(buffer);
  }
}
