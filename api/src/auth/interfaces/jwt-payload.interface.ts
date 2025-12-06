import { MembershipRole, UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  membershipRole: MembershipRole | null;
}
