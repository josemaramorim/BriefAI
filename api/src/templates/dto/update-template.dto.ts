import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTemplateDto {
  @ApiProperty({ description: 'Template title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'JSON Schema (draft-07) defining template structure',
    required: false,
  })
  @IsObject()
  @IsOptional()
  jsonSchema?: Record<string, any>;

  @ApiProperty({ description: 'Make template public', required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
