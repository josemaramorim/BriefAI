import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishTemplateDto {
  @ApiProperty({ description: 'Set template visibility', example: true })
  @IsBoolean()
  isPublic!: boolean;
}
