import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'We should consider adding more sustainability features'
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
