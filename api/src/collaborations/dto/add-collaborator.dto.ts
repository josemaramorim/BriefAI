import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaborationPermission } from '@prisma/client';

export class AddCollaboratorDto {
  @ApiProperty({ 
    description: 'User ID to add as collaborator',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Permission level for the collaborator',
    enum: CollaborationPermission,
    example: CollaborationPermission.COMMENT
  })
  @IsEnum(CollaborationPermission)
  @IsNotEmpty()
  permission!: CollaborationPermission;
}
