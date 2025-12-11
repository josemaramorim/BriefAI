import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async upgradePlan(tenantId: string, planName: string) {
    // Busca o plano pelo nome
    const plan = await this.prisma.plan.findFirst({ where: { name: planName } });
    if (!plan) throw new NotFoundException('Plano não encontrado');

    // Calcula a data de renovação (30 dias a partir de agora)
    const renewalAt = new Date();
    renewalAt.setDate(renewalAt.getDate() + 30);

    // Atualiza o tenant para o novo plano, zera trial e define renovação
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId: plan.id,
        trialEndsAt: null, // Remove o trial ao fazer upgrade
        renewalAt, // Define a próxima data de renovação
      },
      include: { plan: true },
    });

    return {
      message: 'Plano atualizado com sucesso',
      tenant: updatedTenant,
      renewalAt,
    };
  }

  /**
   * Processa a renovação de um tenant
   * Este método deve ser chamado quando o período de renovação expira
   * (idealmente por um job agendado)
   */
  async processRenewal(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    // Verifica se precisa renovar
    if (!tenant.renewalAt || new Date() < new Date(tenant.renewalAt)) {
      return {
        message: 'Renovação ainda não necessária',
        nextRenewal: tenant.renewalAt,
      };
    }

    // Calcula a próxima data de renovação (mais 30 dias)
    const nextRenewalAt = new Date();
    nextRenewalAt.setDate(nextRenewalAt.getDate() + 30);

    // Atualiza o tenant com a nova data de renovação
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        renewalAt: nextRenewalAt,
      },
      include: { plan: true },
    });

    // Aqui você pode adicionar lógica adicional:
    // - Registrar a cobrança no billing_usage
    // - Enviar email de confirmação
    // - Processar pagamento via gateway

    return {
      message: 'Renovação processada com sucesso',
      tenant: updatedTenant,
      nextRenewal: nextRenewalAt,
    };
  }

  /**
   * Lista todos os tenants que precisam de renovação
   * Útil para um job/cron que processa renovações pendentes
   */
  async getTenantsNeedingRenewal() {
    const now = new Date();
    
    const tenants = await this.prisma.tenant.findMany({
      where: {
        renewalAt: {
          lte: now, // renewalAt <= now
        },
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    return tenants;
  }
}
