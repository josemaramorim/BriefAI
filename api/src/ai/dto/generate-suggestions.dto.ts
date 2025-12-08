import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSuggestionsDto {
  @ApiProperty({ 
    description: 'Field name from the template schema to generate suggestions for',
    example: 'projectDescription'
  })
  @IsString()
  @IsNotEmpty()
  fieldName!: string;

  @ApiProperty({
    description: 'Context from other fields to help generate better suggestions',
    example: { projectName: 'Modern Office Building', location: 'São Paulo' },
    required: false
  })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  @ApiProperty({
    description: 'Additional instructions for the AI',
    example: 'Focus on sustainability and modern architecture',
    required: false
  })
  @IsString()
  @IsOptional()
  additionalInstructions?: string;
}
