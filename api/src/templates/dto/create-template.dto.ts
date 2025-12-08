import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template title', example: 'Residential Architecture Brief' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'JSON Schema (draft-07) defining template structure',
    example: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        budget: { type: 'number' },
      },
      required: ['projectName'],
    },
  })
  @IsObject()
  @IsNotEmpty()
  jsonSchema!: Record<string, any>;

  @ApiProperty({ description: 'Make template public', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
