import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CollaborationPermission } from '@prisma/client';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CollaborationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async addCollaborator(
    briefingId: string,
    dto: AddCollaboratorDto,
    tenantId: string,
    currentUserId: string,
    lang?: string,
  ) {
    // Validate briefing exists and user has permission
    const briefing = await this.prisma.briefing.findFirst({
      where: { id: briefingId, tenantId },
      include: { client: true },
    });

    if (!briefing) {
      throw new NotFoundException(
        this.i18n.translate('BRIEFS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    // Only brief owner/client or tenant members with EDIT can add collaborators
    const isOwner = briefing.clientId === currentUserId;
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId: currentUserId },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        this.i18n.translate('COLLABORATIONS.NO_PERMISSION', { lang: lang || 'pt' }),
      );
    }

    // Validate user to add exists
    const userToAdd = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!userToAdd) {
      throw new BadRequestException(
        this.i18n.translate('COLLABORATIONS.USER_NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    // Check if collaboration already exists
    const existing = await this.prisma.collaboration.findUnique({
      where: { briefingId_userId: { briefingId, userId: dto.userId } },
    });

    if (existing) {
      throw new BadRequestException(
        this.i18n.translate('COLLABORATIONS.ALREADY_EXISTS', { lang: lang || 'pt' }),
      );
    }

    const collaboration = await this.prisma.collaboration.create({
      data: {
        briefingId,
        userId: dto.userId,
        permission: dto.permission,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return collaboration;
  }

  async listCollaborators(
    briefingId: string,
    tenantId: string,
    currentUserId: string,
    lang?: string,
  ) {
    // Validate briefing exists and user has access
    const briefing = await this.prisma.briefing.findFirst({
      where: { id: briefingId, tenantId },
    });

    if (!briefing) {
      throw new NotFoundException(
        this.i18n.translate('BRIEFS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    // Check if user has access to briefing
    await this.checkBriefingAccess(briefingId, tenantId, currentUserId, lang);

    return this.prisma.collaboration.findMany({
      where: { briefingId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCollaboration(
    collaborationId: string,
    dto: UpdateCollaborationDto,
    tenantId: string,
    currentUserId: string,
    lang?: string,
  ) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: { briefing: true },
    });

    if (!collaboration) {
      throw new NotFoundException(
        this.i18n.translate('COLLABORATIONS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    if (collaboration.briefing.tenantId !== tenantId) {
      throw new ForbiddenException(
        this.i18n.translate('COLLABORATIONS.NO_PERMISSION', { lang: lang || 'pt' }),
      );
    }

    // Only owner or tenant members can update permissions
    const isOwner = collaboration.briefing.clientId === currentUserId;
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId: currentUserId },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        this.i18n.translate('COLLABORATIONS.NO_PERMISSION', { lang: lang || 'pt' }),
      );
    }

    return this.prisma.collaboration.update({
      where: { id: collaborationId },
      data: { permission: dto.permission, updatedAt: new Date() },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeCollaborator(
    collaborationId: string,
    tenantId: string,
    currentUserId: string,
    lang?: string,
  ) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: { briefing: true },
    });

    if (!collaboration) {
      throw new NotFoundException(
        this.i18n.translate('COLLABORATIONS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    if (collaboration.briefing.tenantId !== tenantId) {
      throw new ForbiddenException(
        this.i18n.translate('COLLABORATIONS.NO_PERMISSION', { lang: lang || 'pt' }),
      );
    }

    // Owner or tenant members can remove, or user can remove themselves
    const isOwner = collaboration.briefing.clientId === currentUserId;
    const isSelf = collaboration.userId === currentUserId;
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId: currentUserId },
    });

    if (!isOwner && !isSelf && !isMember) {
      throw new ForbiddenException(
        this.i18n.translate('COLLABORATIONS.NO_PERMISSION', { lang: lang || 'pt' }),
      );
    }

    await this.prisma.collaboration.delete({ where: { id: collaborationId } });

    return { message: this.i18n.translate('COLLABORATIONS.REMOVED', { lang: lang || 'pt' }) };
  }

  // Comments methods
  async createComment(
    briefingId: string,
    dto: CreateCommentDto,
    tenantId: string,
    userId: string,
    lang?: string,
  ) {
    // Validate briefing and permission
    await this.checkBriefingAccess(briefingId, tenantId, userId, lang, CollaborationPermission.COMMENT);

    const comment = await this.prisma.comment.create({
      data: {
        briefingId,
        userId,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return comment;
  }

  async listComments(
    briefingId: string,
    tenantId: string,
    userId: string,
    lang?: string,
  ) {
    // Validate briefing and access
    await this.checkBriefingAccess(briefingId, tenantId, userId, lang);

    return this.prisma.comment.findMany({
      where: { briefingId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteComment(
    commentId: string,
    tenantId: string,
    userId: string,
    lang?: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { briefing: true },
    });

    if (!comment) {
      throw new NotFoundException(
        this.i18n.translate('COLLABORATIONS.COMMENT_NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    if (comment.briefing.tenantId !== tenantId) {
      throw new ForbiddenException(
        this.i18n.translate('COLLABORATIONS.NO_PERMISSION', { lang: lang || 'pt' }),
      );
    }

    // Only comment author or tenant members can delete
    const isAuthor = comment.userId === userId;
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId },
    });

    if (!isAuthor && !isMember) {
      throw new ForbiddenException(
        this.i18n.translate('COLLABORATIONS.NO_PERMISSION', { lang: lang || 'pt' }),
      );
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { message: this.i18n.translate('COLLABORATIONS.COMMENT_DELETED', { lang: lang || 'pt' }) };
  }

  private async checkBriefingAccess(
    briefingId: string,
    tenantId: string,
    userId: string,
    lang?: string,
    minPermission?: CollaborationPermission,
  ): Promise<void> {
    const briefing = await this.prisma.briefing.findFirst({
      where: { id: briefingId, tenantId },
    });

    if (!briefing) {
      throw new NotFoundException(
        this.i18n.translate('BRIEFS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    // Owner always has access
    if (briefing.clientId === userId) return;

    // Tenant members have access
    const isMember = await this.prisma.membership.findFirst({
      where: { tenantId, userId },
    });
    if (isMember) return;

    // Check collaboration
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { briefingId_userId: { briefingId, userId } },
    });

    if (!collaboration) {
      throw new ForbiddenException(
        this.i18n.translate('BRIEFS.ACCESS_DENIED', { lang: lang || 'pt' }),
      );
    }

    // Check minimum permission if specified
    if (minPermission) {
      const permissionLevels = {
        [CollaborationPermission.VIEW]: 0,
        [CollaborationPermission.COMMENT]: 1,
        [CollaborationPermission.EDIT]: 2,
      };

      if (permissionLevels[collaboration.permission] < permissionLevels[minPermission]) {
        throw new ForbiddenException(
          this.i18n.translate('COLLABORATIONS.INSUFFICIENT_PERMISSION', { lang: lang || 'pt' }),
        );
      }
    }
  }
}
