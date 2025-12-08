import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../tenant/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        briefingId: {
          type: 'string',
          description: 'Optional briefing ID',
        },
        templateId: {
          type: 'string',
          description: 'Optional template ID',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @ApiResponse({ status: 403, description: 'No permission to upload to this resource' })
  async uploadAttachment(
    @UploadedFile() file: any,
    @Query('briefingId') briefingId?: string,
    @Query('templateId') templateId?: string,
    @Tenant() tenantId: string = '',
    @CurrentUser() user: AuthUser = {} as AuthUser,
    @I18n() i18n: I18nContext = {} as I18nContext,
  ) {
    return this.attachmentsService.uploadAttachment(
      file,
      tenantId,
      user.id,
      briefingId,
      templateId,
      i18n.lang,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List attachments' })
  @ApiQuery({ name: 'briefingId', required: false, description: 'Filter by briefing ID' })
  @ApiQuery({ name: 'templateId', required: false, description: 'Filter by template ID' })
  @ApiResponse({ status: 200, description: 'List of attachments' })
  async listAttachments(
    @Query('briefingId') briefingId?: string,
    @Query('templateId') templateId?: string,
    @Tenant() tenantId: string = '',
    @CurrentUser() user: AuthUser = {} as AuthUser,
    @I18n() i18n: I18nContext = {} as I18nContext,
  ) {
    return this.attachmentsService.listAttachments(
      tenantId,
      user.id,
      briefingId,
      templateId,
      i18n.lang,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attachment details' })
  @ApiResponse({ status: 200, description: 'Attachment details' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async getAttachment(
    @Param('id') id: string,
    @Tenant() tenantId: string = '',
    @CurrentUser() user: AuthUser = {} as AuthUser,
    @I18n() i18n: I18nContext = {} as I18nContext,
  ) {
    return this.attachmentsService.getAttachment(id, tenantId, user.id, i18n.lang);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download attachment file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async downloadAttachment(
    @Param('id') id: string,
    @Res() res: Response,
    @Tenant() tenantId: string = '',
    @CurrentUser() user: AuthUser = {} as AuthUser,
    @I18n() i18n: I18nContext = {} as I18nContext,
  ) {
    const { buffer, originalName, mimeType } = await this.attachmentsService.downloadAttachment(
      id,
      tenantId,
      user.id,
      i18n.lang,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${originalName}"`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).send(buffer);
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Get signed URL for attachment' })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'URL expiration time in seconds' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async getSignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: number,
    @Tenant() tenantId: string = '',
    @CurrentUser() user: AuthUser = {} as AuthUser,
    @I18n() i18n: I18nContext = {} as I18nContext,
  ) {
    return this.attachmentsService.getSignedUrl(
      id,
      tenantId,
      user.id,
      expiresIn ? parseInt(expiresIn.toString(), 10) : 3600,
      i18n.lang,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  @ApiResponse({ status: 403, description: 'No permission to delete this attachment' })
  async deleteAttachment(
    @Param('id') id: string,
    @Tenant() tenantId: string = '',
    @CurrentUser() user: AuthUser = {} as AuthUser,
    @I18n() i18n: I18nContext = {} as I18nContext,
  ) {
    return this.attachmentsService.deleteAttachment(id, tenantId, user.id, i18n.lang);
  }
}
