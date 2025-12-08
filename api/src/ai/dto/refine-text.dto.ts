import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefineTextDto {
  @ApiProperty({
    description: 'Text to be refined by AI',
    example: 'We need a building for offices with parking'
  })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiProperty({
    description: 'Type of refinement (improve, expand, simplify, professional)',
    example: 'professional',
    enum: ['improve', 'expand', 'simplify', 'professional']
  })
  @IsString()
  @IsNotEmpty()
  refinementType!: 'improve' | 'expand' | 'simplify' | 'professional';
}
