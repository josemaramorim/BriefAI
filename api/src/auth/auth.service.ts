import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  Membership,
  MembershipRole,
  Tenant,
  User,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { AuthUser } from './interfaces/auth-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    dto: LoginDto,
    tenantFromRequest?: Tenant | null,
  ): Promise<AuthResponse> {
    const tenant = await this.resolveTenant(tenantFromRequest ?? null, dto.tenantSlug);
    const { user, membership } = await this.validateUserForLogin(
      dto.email,
      dto.password,
      tenant,
    );

    return this.buildAuthResponse(user, tenant, membership);
  }

  async register(
    dto: RegisterDto,
    tenantFromRequest?: Tenant | null,
  ): Promise<AuthResponse> {
    const targetRole = dto.role ?? UserRole.CLIENT;
    if (targetRole === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Cadastro de super admin precisa ser feito manualmente.',
      );
    }

    const tenant = await this.resolveTenant(tenantFromRequest ?? null, dto.tenantSlug);
    if (!tenant) {
      throw new BadRequestException('Tenant obrigatório para cadastro.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('E-mail já está em uso.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: targetRole,
        locale: dto.locale ?? 'pt-BR',
      },
    });

    const membershipRole = this.mapMembershipRole(targetRole);
    const membership = await this.prisma.membership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: membershipRole,
      },
    });

    return this.buildAuthResponse(user, tenant, membership);
  }

  private async resolveTenant(
    tenantFromRequest: Tenant | null,
    tenantSlug?: string,
  ): Promise<Tenant | null> {
    if (tenantFromRequest) {
      return tenantFromRequest;
    }

    if (!tenantSlug) {
      return null;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant não encontrado.');
    }

    return tenant;
  }

  private mapMembershipRole(role: UserRole): MembershipRole {
    switch (role) {
      case UserRole.TENANT_ADMIN:
        return MembershipRole.TENANT_ADMIN;
      case UserRole.ARCHITECT:
        return MembershipRole.ARCHITECT;
      case UserRole.CLIENT:
        return MembershipRole.CLIENT;
      default:
        throw new ForbiddenException('Role não suportada para membership.');
    }
  }

  private async validateUserForLogin(
    email: string,
    password: string,
    tenant: Tenant | null,
  ): Promise<{
    user: User & { memberships: Membership[] };
    membership: Membership | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { memberships: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!tenant) {
      if (user.role === UserRole.SUPER_ADMIN) {
        return { user, membership: null };
      }
      throw new ForbiddenException('Tenant obrigatório para este usuário.');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return { user, membership: null };
    }

    const membership = user.memberships.find(
      (member) => member.tenantId === tenant.id,
    );

    if (!membership) {
      throw new ForbiddenException('Usuário não pertence a este tenant.');
    }

    return { user, membership };
  }

  private buildAuthResponse(
    user: User,
    tenant: Tenant | null,
    membership: Membership | null,
  ): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant?.id ?? null,
      tenantSlug: tenant?.slug ?? null,
      membershipRole: membership?.role ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      locale: user.locale,
      tenantId: tenant?.id ?? null,
      tenantSlug: tenant?.slug ?? null,
      membershipRole: membership?.role ?? null,
    };

    return {
      accessToken,
      user: authUser,
    };
  }
}
