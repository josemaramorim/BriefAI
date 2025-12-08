import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationsService } from './collaborations.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CollaborationPermission } from '@prisma/client';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('CollaborationsService', () => {
  let service: CollaborationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationsService,
        {
          provide: PrismaService,
          useValue: {
            briefing: { findFirst: jest.fn() },
            user: { findUnique: jest.fn() },
            membership: { findFirst: jest.fn() },
            collaboration: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            comment: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<CollaborationsService>(CollaborationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('addCollaborator', () => {
    it('should add collaborator successfully', async () => {
      const briefing = { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' };
      const userToAdd = { id: 'user2', name: 'User 2', email: 'user2@test.com' };
      const collaboration = { id: 'collab1', briefingId: 'brief1', userId: 'user2', permission: CollaborationPermission.VIEW };

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(briefing as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: 'mem1' } as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userToAdd as any);
      jest.spyOn(prisma.collaboration, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.collaboration, 'create').mockResolvedValue({ ...collaboration, user: userToAdd } as any);

      const result = await service.addCollaborator(
        'brief1',
        { userId: 'user2', permission: CollaborationPermission.VIEW },
        'tenant1',
        'user1',
      );

      expect(result).toBeDefined();
      expect(prisma.collaboration.create).toHaveBeenCalled();
    });

    it('should throw if user already collaborator', async () => {
      const briefing = { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' };
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(briefing as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: 'mem1' } as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'user2' } as any);
      jest.spyOn(prisma.collaboration, 'findUnique').mockResolvedValue({ id: 'collab1' } as any);

      await expect(
        service.addCollaborator('brief1', { userId: 'user2', permission: CollaborationPermission.VIEW }, 'tenant1', 'user1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeCollaborator', () => {
    it('should remove collaborator successfully', async () => {
      const collaboration = {
        id: 'collab1',
        briefingId: 'brief1',
        userId: 'user2',
        briefing: { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' },
      };

      jest.spyOn(prisma.collaboration, 'findUnique').mockResolvedValue(collaboration as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: 'mem1' } as any);
      jest.spyOn(prisma.collaboration, 'delete').mockResolvedValue(collaboration as any);

      const result = await service.removeCollaborator('collab1', 'tenant1', 'user1');

      expect(result.message).toBeDefined();
      expect(prisma.collaboration.delete).toHaveBeenCalledWith({ where: { id: 'collab1' } });
    });
  });

  describe('createComment', () => {
    it('should create comment with COMMENT permission', async () => {
      const briefing = { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' };
      const comment = { id: 'comment1', briefingId: 'brief1', userId: 'user2', content: 'Test' };

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(briefing as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.collaboration, 'findUnique').mockResolvedValue({
        id: 'collab1',
        permission: CollaborationPermission.COMMENT,
      } as any);
      jest.spyOn(prisma.comment, 'create').mockResolvedValue(comment as any);

      const result = await service.createComment('brief1', { content: 'Test' }, 'tenant1', 'user2');

      expect(result).toBeDefined();
      expect(prisma.comment.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException with VIEW permission', async () => {
      const briefing = { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' };

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(briefing as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.collaboration, 'findUnique').mockResolvedValue({
        id: 'collab1',
        permission: CollaborationPermission.VIEW,
      } as any);

      await expect(
        service.createComment('brief1', { content: 'Test' }, 'tenant1', 'user2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listComments', () => {
    it('should list comments for brief', async () => {
      const briefing = { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' };
      const comments = [{ id: 'comment1', content: 'Test' }];

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(briefing as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: 'mem1' } as any);
      jest.spyOn(prisma.comment, 'findMany').mockResolvedValue(comments as any);

      const result = await service.listComments('brief1', 'tenant1', 'user1');

      expect(result).toEqual(comments);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { briefingId: 'brief1' },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete comment by author', async () => {
      const comment = {
        id: 'comment1',
        briefingId: 'brief1',
        userId: 'user1',
        briefing: { id: 'brief1', tenantId: 'tenant1' },
      };

      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(comment as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.comment, 'delete').mockResolvedValue(comment as any);

      const result = await service.deleteComment('comment1', 'tenant1', 'user1');

      expect(result.message).toBeDefined();
      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'comment1' } });
    });

    it('should delete comment by member', async () => {
      const comment = {
        id: 'comment1',
        briefingId: 'brief1',
        userId: 'user2',
        briefing: { id: 'brief1', tenantId: 'tenant1' },
      };

      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(comment as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: 'mem1' } as any);
      jest.spyOn(prisma.comment, 'delete').mockResolvedValue(comment as any);

      const result = await service.deleteComment('comment1', 'tenant1', 'user1');

      expect(result.message).toBeDefined();
      expect(prisma.comment.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not author or member', async () => {
      const comment = {
        id: 'comment1',
        briefingId: 'brief1',
        userId: 'user2',
        briefing: { id: 'brief1', tenantId: 'tenant1' },
      };

      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(comment as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);

      await expect(service.deleteComment('comment1', 'tenant1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if comment not found', async () => {
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteComment('comment1', 'tenant1', 'user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCollaboration', () => {
    it('should update collaboration successfully', async () => {
      const collaboration = {
        id: 'collab1',
        briefingId: 'brief1',
        userId: 'user2',
        permission: CollaborationPermission.VIEW,
        briefing: { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' },
      };

      jest.spyOn(prisma.collaboration, 'findUnique').mockResolvedValue(collaboration as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: 'mem1' } as any);
      jest.spyOn(prisma.collaboration, 'update').mockResolvedValue({
        ...collaboration,
        permission: CollaborationPermission.EDIT,
      } as any);

      const result = await service.updateCollaboration(
        'collab1',
        { permission: CollaborationPermission.EDIT },
        'tenant1',
        'user1',
      );

      expect(result.permission).toBe(CollaborationPermission.EDIT);
      expect(prisma.collaboration.update).toHaveBeenCalled();
    });
  });

  describe('listCollaborators', () => {
    it('should list collaborators for client owner', async () => {
      const briefing = { id: 'brief1', tenantId: 'tenant1', clientId: 'user1' };
      const collaborators = [{ id: 'collab1', userId: 'user2' }];

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(briefing as any);
      jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.collaboration, 'findMany').mockResolvedValue(collaborators as any);

      const result = await service.listCollaborators('brief1', 'tenant1', 'user1');

      expect(result).toEqual(collaborators);
    });

    it('should throw NotFoundException if briefing not found', async () => {
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(null);

      await expect(service.listCollaborators('brief1', 'tenant1', 'user1')).rejects.toThrow(NotFoundException);
    });
  });
});
