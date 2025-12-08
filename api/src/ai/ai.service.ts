import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import OpenAI from 'openai';
import { AiEventType } from '@prisma/client';
import { GenerateSuggestionsDto } from './dto/generate-suggestions.dto';
import { RefineTextDto } from './dto/refine-text.dto';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateSuggestions(
    briefId: string,
    dto: GenerateSuggestionsDto,
    tenantId: string,
    lang?: string,
  ): Promise<{ suggestions: string[] }> {
    // Validate brief exists and get template
    const brief = await this.prisma.briefing.findFirst({
      where: { id: briefId, tenantId },
      include: { template: true },
    });

    if (!brief) {
      throw new BadRequestException(
        this.i18n.translate('BRIEFS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    // Build context from template and existing answers
    const templateTitle = brief.template.title;
    const existingAnswers = brief.answersJson as Record<string, any>;
    const contextInfo = dto.context || existingAnswers || {};

    // Build prompt
    const prompt = this.buildSuggestionsPrompt(
      templateTitle,
      dto.fieldName,
      contextInfo,
      dto.additionalInstructions,
    );

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert architectural consultant helping users create detailed project briefs. Provide 3-5 clear, professional suggestions.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content || '';
      const suggestions = this.parseSuggestions(content);

      // Log AI event
      await this.logAiEvent(
        tenantId,
        briefId,
        AiEventType.SUGGESTIONS,
        {
          fieldName: dto.fieldName,
          context: contextInfo,
          suggestions,
          tokensUsed: completion.usage?.total_tokens,
        },
      );

      return { suggestions };
    } catch (error: any) {
      throw new BadRequestException(
        this.i18n.translate('AI.GENERATION_FAILED', {
          lang: lang || 'pt',
          args: { error: error.message },
        }),
      );
    }
  }

  async refineText(
    briefId: string,
    dto: RefineTextDto,
    tenantId: string,
    lang?: string,
  ): Promise<{ refinedText: string }> {
    // Validate brief exists
    const brief = await this.prisma.briefing.findFirst({
      where: { id: briefId, tenantId },
    });

    if (!brief) {
      throw new BadRequestException(
        this.i18n.translate('BRIEFS.NOT_FOUND', { lang: lang || 'pt' }),
      );
    }

    const prompt = this.buildRefinementPrompt(dto.text, dto.refinementType);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert writer helping to refine architectural project descriptions. Maintain technical accuracy while improving clarity.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 800,
      });

      const refinedText = completion.choices[0]?.message?.content?.trim() || dto.text;

      // Log AI event
      await this.logAiEvent(tenantId, briefId, AiEventType.SUMMARY, {
        originalText: dto.text,
        refinementType: dto.refinementType,
        refinedText,
        tokensUsed: completion.usage?.total_tokens,
      });

      return { refinedText };
    } catch (error: any) {
      throw new BadRequestException(
        this.i18n.translate('AI.REFINEMENT_FAILED', {
          lang: lang || 'pt',
          args: { error: error.message },
        }),
      );
    }
  }

  private buildSuggestionsPrompt(
    templateTitle: string,
    fieldName: string,
    context: Record<string, any>,
    additionalInstructions?: string,
  ): string {
    let prompt = `I'm working on a "${templateTitle}" project brief.\n\n`;
    prompt += `I need suggestions for the field: "${fieldName}".\n\n`;

    if (Object.keys(context).length > 0) {
      prompt += `Context from other fields:\n`;
      for (const [key, value] of Object.entries(context)) {
        if (value) {
          prompt += `- ${key}: ${value}\n`;
        }
      }
      prompt += '\n';
    }

    if (additionalInstructions) {
      prompt += `Additional requirements: ${additionalInstructions}\n\n`;
    }

    prompt += `Please provide 3-5 specific, actionable suggestions for "${fieldName}". Format each suggestion as a numbered list.`;

    return prompt;
  }

  private buildRefinementPrompt(text: string, refinementType: string): string {
    const instructions = {
      improve: 'Improve this text by making it clearer, more precise, and better structured while maintaining the original meaning.',
      expand: 'Expand this text by adding relevant details, examples, and context that would be valuable for an architectural project brief.',
      simplify: 'Simplify this text by removing jargon, using clearer language, and making it more accessible while keeping key information.',
      professional: 'Rewrite this text in a professional, formal tone suitable for an architectural project brief or proposal.',
    };

    return `${instructions[refinementType as keyof typeof instructions]}\n\nOriginal text:\n"${text}"\n\nRefined version:`;
  }

  private parseSuggestions(content: string): string[] {
    // Parse numbered list or bullet points
    const lines = content.split('\n').filter(line => line.trim());
    const suggestions: string[] = [];

    for (const line of lines) {
      // Remove numbering, bullets, dashes
      const cleaned = line.replace(/^[\d\.\-\*\•]+\s*/, '').trim();
      if (cleaned.length > 10) {
        suggestions.push(cleaned);
      }
    }

    return suggestions.slice(0, 5); // Max 5 suggestions
  }

  private async logAiEvent(
    tenantId: string,
    briefingId: string,
    eventType: AiEventType,
    payload: any,
  ): Promise<void> {
    try {
      await this.prisma.aiEvent.create({
        data: {
          tenantId,
          briefingId,
          eventType,
          payload,
        },
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to log AI event:', error);
    }
  }
}
