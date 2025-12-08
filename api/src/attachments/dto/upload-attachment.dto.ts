import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadAttachmentDto {
  @ApiPropertyOptional({
    description: 'ID of the briefing this attachment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  briefingId?: string;

  @ApiPropertyOptional({
    description: 'ID of the template this attachment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({
    description: 'The file to upload',
    type: 'string',
    format: 'binary',
  })
  @IsNotEmpty()
  file: any;
}
