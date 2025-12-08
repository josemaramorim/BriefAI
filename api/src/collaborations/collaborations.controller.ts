import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollaborationsService } from './collaborations.service';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Tenant } from '../tenant/tenant.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('collaborations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('briefs/:briefingId/collaborations')
export class CollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Post()
  @ApiOperation({ summary: 'Add collaborator to brief' })
  @ApiResponse({ status: 201, description: 'Collaborator added' })
  @ApiResponse({ status: 400, description: 'User already collaborator or not found' })
  @ApiResponse({ status: 403, description: 'No permission to add collaborators' })
  addCollaborator(
    @Param('briefingId') briefingId: string,
    @Body() dto: AddCollaboratorDto,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.collaborationsService.addCollaborator(
      briefingId,
      dto,
      tenantId,
      user.id,
      i18n.lang,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all collaborators of a brief' })
  @ApiResponse({ status: 200, description: 'Collaborators list' })
  listCollaborators(
    @Param('briefingId') briefingId: string,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.collaborationsService.listCollaborators(
      briefingId,
      tenantId,
      user.id,
      i18n.lang,
    );
  }

  @Patch(':collaborationId')
  @ApiOperation({ summary: 'Update collaboration permission' })
  @ApiResponse({ status: 200, description: 'Permission updated' })
  @ApiResponse({ status: 403, description: 'No permission to update' })
  updateCollaboration(
    @Param('collaborationId') collaborationId: string,
    @Body() dto: UpdateCollaborationDto,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.collaborationsService.updateCollaboration(
      collaborationId,
      dto,
      tenantId,
      user.id,
      i18n.lang,
    );
  }

  @Delete(':collaborationId')
  @ApiOperation({ summary: 'Remove collaborator' })
  @ApiResponse({ status: 200, description: 'Collaborator removed' })
  @ApiResponse({ status: 403, description: 'No permission to remove' })
  removeCollaborator(
    @Param('collaborationId') collaborationId: string,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.collaborationsService.removeCollaborator(
      collaborationId,
      tenantId,
      user.id,
      i18n.lang,
    );
  }
}

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('briefs/:briefingId/comments')
export class CommentsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Post()
  @ApiOperation({ summary: 'Add comment to brief' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @ApiResponse({ status: 403, description: 'No permission to comment' })
  createComment(
    @Param('briefingId') briefingId: string,
    @Body() dto: CreateCommentDto,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.collaborationsService.createComment(
      briefingId,
      dto,
      tenantId,
      user.id,
      i18n.lang,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all comments of a brief' })
  @ApiResponse({ status: 200, description: 'Comments list' })
  listComments(
    @Param('briefingId') briefingId: string,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.collaborationsService.listComments(
      briefingId,
      tenantId,
      user.id,
      i18n.lang,
    );
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiResponse({ status: 403, description: 'No permission to delete' })
  deleteComment(
    @Param('commentId') commentId: string,
    @Tenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @I18n() i18n: I18nContext,
  ) {
    return this.collaborationsService.deleteComment(
      commentId,
      tenantId,
      user.id,
      i18n.lang,
    );
  }
}
