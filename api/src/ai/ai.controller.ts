import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateSuggestionsDto } from './dto/generate-suggestions.dto';
import { RefineTextDto } from './dto/refine-text.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../tenant/tenant.decorator';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('briefs/:briefId/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggestions')
  @ApiOperation({ summary: 'Generate AI suggestions for a brief field' })
  @ApiResponse({ 
    status: 200, 
    description: 'Suggestions generated',
    schema: {
      example: {
        suggestions: [
          'Consider incorporating natural lighting through large windows',
          'Include flexible workspace areas for collaboration',
          'Design with energy efficiency in mind using sustainable materials'
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Brief not found or AI error' })
  generateSuggestions(
    @Param('briefId') briefId: string,
    @Body() dto: GenerateSuggestionsDto,
    @Tenant() tenantId: string,
    @I18n() i18n: I18nContext,
  ) {
    return this.aiService.generateSuggestions(briefId, dto, tenantId, i18n.lang);
  }

  @Post('refine')
  @ApiOperation({ summary: 'Refine text using AI' })
  @ApiResponse({ 
    status: 200, 
    description: 'Text refined',
    schema: {
      example: {
        refinedText: 'A contemporary commercial office building designed to accommodate 200 employees, featuring modern amenities, dedicated parking facilities, and sustainable design principles.'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Brief not found or AI error' })
  refineText(
    @Param('briefId') briefId: string,
    @Body() dto: RefineTextDto,
    @Tenant() tenantId: string,
    @I18n() i18n: I18nContext,
  ) {
    return this.aiService.refineText(briefId, dto, tenantId, i18n.lang);
  }
}
