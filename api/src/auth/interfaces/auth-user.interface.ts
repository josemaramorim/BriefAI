import { MembershipRole, UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  locale: string;
  tenantId: string | null;
  tenantSlug: string | null;
  membershipRole: MembershipRole | null;
}
