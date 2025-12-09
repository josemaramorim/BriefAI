import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportFormat {
  PDF = 'pdf',
  JSON = 'json',
  ZIP = 'zip',
}

export class ExportBriefingDto {
  @ApiPropertyOptional({
    enum: ExportFormat,
    description: 'Export format',
    default: ExportFormat.PDF,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.PDF;

  @ApiPropertyOptional({
    description: 'Include attachments in export (for ZIP format)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeAttachments?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include comments in export',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeComments?: boolean = true;

  @ApiPropertyOptional({
    description: 'Summarized version (for PDF format)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  summarized?: boolean = false;
}
