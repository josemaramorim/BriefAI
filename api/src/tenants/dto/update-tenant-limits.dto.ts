import { IsObject } from 'class-validator';

export class UpdateTenantLimitsDto {
  @IsObject()
  limitsOverride!: Record<string, unknown>;
}
