import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaborationPermission } from '@prisma/client';

export class UpdateCollaborationDto {
  @ApiProperty({
    description: 'New permission level',
    enum: CollaborationPermission,
    example: CollaborationPermission.EDIT
  })
  @IsEnum(CollaborationPermission)
  permission!: CollaborationPermission;
}
