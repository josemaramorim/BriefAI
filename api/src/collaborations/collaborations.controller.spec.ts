import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationsController, CommentsController } from './collaborations.controller';
import { CollaborationsService } from './collaborations.service';
import { CollaborationPermission } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

describe('CollaborationsController', () => {
  let controller: CollaborationsController;
  let service: CollaborationsService;

  const mockAuthUser: AuthUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ARCHITECT' as any,
    tenantId: 'tenant123',
    tenantSlug: 'test-tenant',
    locale: 'pt',
    membershipRole: 'ARCHITECT' as any,
  };

  const mockI18nContext = { lang: 'pt' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollaborationsController],
      providers: [
        {
          provide: CollaborationsService,
          useValue: {
            addCollaborator: jest.fn(),
            listCollaborators: jest.fn(),
            updateCollaboration: jest.fn(),
            removeCollaborator: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CollaborationsController>(CollaborationsController);
    service = module.get<CollaborationsService>(CollaborationsService);
  });

  describe('addCollaborator', () => {
    it('should call service.addCollaborator', async () => {
      const dto = { userId: 'user2', permission: CollaborationPermission.VIEW };
      const result = { id: 'collab1', briefingId: 'brief1', ...dto };

      jest.spyOn(service, 'addCollaborator').mockResolvedValue(result as any);

      const response = await controller.addCollaborator(
        'brief1',
        dto,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.addCollaborator).toHaveBeenCalledWith('brief1', dto, 'tenant123', 'user123', 'pt');
      expect(response).toEqual(result);
    });
  });

  describe('listCollaborators', () => {
    it('should call service.listCollaborators', async () => {
      const collaborators = [{ id: 'collab1', userId: 'user2' }];
      jest.spyOn(service, 'listCollaborators').mockResolvedValue(collaborators as any);

      const response = await controller.listCollaborators(
        'brief1',
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.listCollaborators).toHaveBeenCalledWith('brief1', 'tenant123', 'user123', 'pt');
      expect(response).toEqual(collaborators);
    });
  });
});

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CollaborationsService;

  const mockAuthUser: AuthUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ARCHITECT' as any,
    tenantId: 'tenant123',
    tenantSlug: 'test-tenant',
    locale: 'pt',
    membershipRole: 'ARCHITECT' as any,
  };

  const mockI18nContext = { lang: 'pt' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CollaborationsService,
          useValue: {
            createComment: jest.fn(),
            listComments: jest.fn(),
            deleteComment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CollaborationsService>(CollaborationsService);
  });

  describe('createComment', () => {
    it('should call service.createComment', async () => {
      const dto = { content: 'Test comment' };
      const result = { id: 'comment1', briefingId: 'brief1', userId: 'user123', ...dto };

      jest.spyOn(service, 'createComment').mockResolvedValue(result as any);

      const response = await controller.createComment(
        'brief1',
        dto,
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.createComment).toHaveBeenCalledWith('brief1', dto, 'tenant123', 'user123', 'pt');
      expect(response).toEqual(result);
    });
  });

  describe('listComments', () => {
    it('should call service.listComments', async () => {
      const comments = [{ id: 'comment1', content: 'Test' }];
      jest.spyOn(service, 'listComments').mockResolvedValue(comments as any);

      const response = await controller.listComments(
        'brief1',
        'tenant123',
        mockAuthUser,
        mockI18nContext as any,
      );

      expect(service.listComments).toHaveBeenCalledWith('brief1', 'tenant123', 'user123', 'pt');
      expect(response).toEqual(comments);
    });
  });
});
