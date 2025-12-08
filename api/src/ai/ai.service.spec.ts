import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';

jest.mock('openai');

describe('AiService', () => {
  let service: AiService;
  let prisma: PrismaService;
  let openaiMock: jest.Mocked<OpenAI>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: PrismaService,
          useValue: {
            briefing: { findFirst: jest.fn() },
            aiEvent: { create: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-api-key';
              return null;
            }),
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

    service = module.get<AiService>(AiService);
    prisma = module.get<PrismaService>(PrismaService);

    // Mock OpenAI instance
    const createMock = jest.fn();
    openaiMock = {
      chat: {
        completions: {
          create: createMock,
        },
      },
    } as any;

    (service as any).openai = openaiMock;
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions successfully', async () => {
      const brief = {
        id: 'brief1',
        tenantId: 'tenant1',
        template: { title: 'Office Building', jsonSchema: {} },
        answersJson: { projectName: 'New Office' },
      };

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      jest.spyOn(prisma.aiEvent, 'create').mockResolvedValue({} as any);

      const createMock = (service as any).openai.chat.completions.create;
      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: '1. Consider open floor plans\n2. Include meeting rooms\n3. Add natural lighting',
            },
          },
        ],
        usage: { total_tokens: 100 },
      } as any);

      const result = await service.generateSuggestions(
        'brief1',
        { fieldName: 'design', context: {} },
        'tenant1',
      );

      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions[0]).toContain('open floor plans');
      expect(prisma.aiEvent.create).toHaveBeenCalled();
    });

    it('should throw error if brief not found', async () => {
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(null);

      await expect(
        service.generateSuggestions('invalid', { fieldName: 'test' }, 'tenant1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle OpenAI API errors', async () => {
      const brief = {
        id: 'brief1',
        template: { title: 'Test', jsonSchema: {} },
        answersJson: {},
      };

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      
      const createMock = (service as any).openai.chat.completions.create;
      createMock.mockRejectedValue(new Error('API Error'));

      await expect(
        service.generateSuggestions('brief1', { fieldName: 'test' }, 'tenant1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refineText', () => {
    it('should refine text successfully', async () => {
      const brief = { id: 'brief1', tenantId: 'tenant1' };

      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(brief as any);
      jest.spyOn(prisma.aiEvent, 'create').mockResolvedValue({} as any);

      const createMock = (service as any).openai.chat.completions.create;
      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'A modern, sustainable office building designed for efficiency.',
            },
          },
        ],
        usage: { total_tokens: 50 },
      } as any);

      const result = await service.refineText(
        'brief1',
        { text: 'office building', refinementType: 'professional' },
        'tenant1',
      );

      expect(result.refinedText).toContain('modern');
      expect(prisma.aiEvent.create).toHaveBeenCalled();
    });

    it('should throw error if brief not found', async () => {
      jest.spyOn(prisma.briefing, 'findFirst').mockResolvedValue(null);

      await expect(
        service.refineText('invalid', { text: 'test', refinementType: 'improve' }, 'tenant1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
