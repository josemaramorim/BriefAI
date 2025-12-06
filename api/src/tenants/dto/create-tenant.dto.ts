import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  planId?: string;
}
