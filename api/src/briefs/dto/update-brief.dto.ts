import { IsObject, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BriefingStatus } from '@prisma/client';

export class UpdateBriefDto {
  @ApiProperty({
    description: 'Brief answers (validated against template JSON Schema)',
    example: {
      projectName: 'Updated Residential House',
      budget: 600000
    },
    required: false
  })
  @IsObject()
  @IsOptional()
  answersJson?: Record<string, any>;

  @ApiProperty({
    description: 'Brief status',
    enum: BriefingStatus,
    example: BriefingStatus.IN_PROGRESS,
    required: false
  })
  @IsEnum(BriefingStatus)
  @IsOptional()
  status?: BriefingStatus;

  @ApiProperty({
    description: 'Completion progress percentage (0-100)',
    example: 75,
    minimum: 0,
    maximum: 100,
    required: false
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}
