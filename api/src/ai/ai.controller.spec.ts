import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

  const mockI18nContext = { lang: 'pt' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: {
            generateSuggestions: jest.fn(),
            refineText: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);
  });

  describe('generateSuggestions', () => {
    it('should call service.generateSuggestions with correct params', async () => {
      const dto = { fieldName: 'description', context: { name: 'Project' } };
      const result = { suggestions: ['Suggestion 1', 'Suggestion 2'] };

      jest.spyOn(service, 'generateSuggestions').mockResolvedValue(result);

      const response = await controller.generateSuggestions(
        'brief123',
        dto,
        'tenant123',
        mockI18nContext as any,
      );

      expect(service.generateSuggestions).toHaveBeenCalledWith(
        'brief123',
        dto,
        'tenant123',
        'pt',
      );
      expect(response).toEqual(result);
    });
  });

  describe('refineText', () => {
    it('should call service.refineText with correct params', async () => {
      const dto = { text: 'Simple text', refinementType: 'professional' as const };
      const result = { refinedText: 'Professional refined text' };

      jest.spyOn(service, 'refineText').mockResolvedValue(result);

      const response = await controller.refineText(
        'brief123',
        dto,
        'tenant123',
        mockI18nContext as any,
      );

      expect(service.refineText).toHaveBeenCalledWith('brief123', dto, 'tenant123', 'pt');
      expect(response).toEqual(result);
    });
  });
});
