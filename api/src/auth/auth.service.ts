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
    // Primeiro valida o usuário
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: { include: { tenant: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Se é SUPER_ADMIN, não precisa de tenant
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.buildAuthResponse(user, null, null);
    }

    // Se não tem membership, erro
    if (!user.memberships || user.memberships.length === 0) {
      throw new ForbiddenException('Usuário não está associado a nenhum tenant.');
    }

    // Resolve o tenant: usa o fornecido, ou o primeiro do usuário
    let tenant = await this.resolveTenant(tenantFromRequest ?? null, dto.tenantSlug);
    let membership: Membership | undefined;

    if (!tenant) {
      // Usa o primeiro tenant do usuário
      membership = user.memberships[0];
      tenant = (membership as any).tenant || await this.prisma.tenant.findUnique({ where: { id: membership.tenantId } });
    } else {
      // Verifica se usuário pertence ao tenant especificado
      membership = user.memberships.find((m) => m.tenantId === tenant!.id);
      if (!membership) {
        throw new ForbiddenException('Usuário não pertence a este tenant.');
      }
    }

    return this.buildAuthResponse(user, tenant, membership);
  }

  async register(
    dto: RegisterDto,
    tenantFromRequest?: Tenant | null,
  ): Promise<AuthResponse> {
    // Se forneceu tenantName, está criando um novo tenant (será TENANT_ADMIN)
    const isCreatingNewTenant = !dto.tenantSlug && !!dto.tenantName;
    const targetRole = isCreatingNewTenant ? UserRole.TENANT_ADMIN : (dto.role ?? UserRole.CLIENT);
    
    if (targetRole === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Cadastro de super admin precisa ser feito manualmente.',
      );
    }

    // Registro público só permite criar novos tenants, não entrar em existentes
    if (!isCreatingNewTenant) {
      throw new BadRequestException(
        'Registro público apenas para criar novos tenants. Forneça tenantName.',
      );
    }

    let tenant = await this.resolveTenant(tenantFromRequest ?? null, dto.tenantSlug);
    
    // Se não encontrou tenant e foi fornecido tenantName, cria um novo com plano Trial
    if (!tenant && dto.tenantName) {
      const slug = this.generateSlug(dto.tenantName);
      
      // Busca dias de trial na config (padrão: 14)
      const trialDaysConfig = await this.prisma.appConfig.findUnique({
        where: { key: 'trial_days' },
      });
      const trialDays = trialDaysConfig ? parseInt(trialDaysConfig.value, 10) : 14;
      
      // Busca ou cria plano Trial
      let trialPlan = await this.prisma.plan.findFirst({
        where: { name: 'Trial' },
      });
      
      if (!trialPlan) {
        trialPlan = await this.prisma.plan.create({
          data: {
            name: 'Trial',
            priceCents: 0,
            currency: 'USD',
            isDefault: true,
            limitsJson: {
              trialDays,
              maxBriefings: 10,
              maxTemplates: 5,
              maxUsers: 3,
              maxStorageMB: 100,
              features: {
                aiSuggestions: true,
                exportFormats: ['pdf'],
                collaboration: true,
              },
            },
          },
        });
      }
      
      // Calcula data de expiração do trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      
      tenant = await this.prisma.tenant.create({
        data: {
          name: dto.tenantName,
          slug,
          planId: trialPlan.id,
          trialEndsAt,
        },
      });
    }
    
    if (!tenant) {
      throw new BadRequestException('Tenant obrigatório para cadastro. Forneça tenantName.');
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

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-'); // Remove hífens duplicados
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
