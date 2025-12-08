import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBriefDto {
  @ApiProperty({ description: 'Template ID to base the brief on', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiProperty({ 
    description: 'Client user ID (optional)', 
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false 
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({
    description: 'Brief answers (validated against template JSON Schema)',
    example: {
      projectName: 'Residential House',
      budget: 500000,
      location: 'São Paulo, SP'
    }
  })
  @IsObject()
  @IsOptional()
  answersJson?: Record<string, any>;
}
