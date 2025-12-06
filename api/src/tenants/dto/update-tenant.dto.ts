import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TenantStatus } from '@prisma/client';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
