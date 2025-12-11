import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../prisma/app-config.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService, private appConfig: AppConfigService) {}

  async getMetrics(tenantId: string): Promise<any> {
    // Briefings metrics
    const [totalBriefings, inProgressBriefings, completedBriefings, draftBriefings] = await Promise.all([
      this.prisma.briefing.count({ where: { tenantId } }),
      this.prisma.briefing.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      this.prisma.briefing.count({ where: { tenantId, status: 'COMPLETED' } }),
      this.prisma.briefing.count({ where: { tenantId, status: 'DRAFT' } }),
    ]);

    // Templates metrics
    const [totalTemplates, publishedTemplates, draftTemplates] = await Promise.all([
      this.prisma.template.count({ where: { tenantId } }),
      this.prisma.template.count({ where: { tenantId, isPublic: true } }),
      this.prisma.template.count({ where: { tenantId, isPublic: false } }),
    ]);

    // Collaborations metrics
    const totalCollaborators = await this.prisma.collaboration.count({ where: { briefing: { tenantId } } });
    // Active collaborators: users with at least one collaboration
    const activeCollaborators = await this.prisma.collaboration.groupBy({
      by: ['userId'],
      where: { briefing: { tenantId } },
      _count: { userId: true },
    });

    // Storage metrics
    const totalAttachments = await this.prisma.attachment.count({ where: { tenantId } });
    const totalSizeAgg = await this.prisma.attachment.aggregate({
      where: { tenantId },
      _sum: { size: true },
    });
    const totalSize = totalSizeAgg._sum.size || 0;

    return {
      briefings: {
        total: totalBriefings,
        inProgress: inProgressBriefings,
        completed: completedBriefings,
        draft: draftBriefings,
      },
      templates: {
        total: totalTemplates,
        published: publishedTemplates,
        draft: draftTemplates,
      },
      collaborations: {
        totalCollaborators,
        activeCollaborators: activeCollaborators.length,
      },
      storage: {
        totalAttachments,
        totalSize,
      },
      plan: await this.getPlanStatus(tenantId),
    };
  }

  async getPlanStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    const status = {
      planName: tenant?.plan.name || 'Unknown',
      trialEndsAt: tenant?.trialEndsAt,
      renewalAt: tenant?.renewalAt,
      isTrialActive: false,
      daysRemaining: 0,
      percentageRemaining: 0,
      status: 'active' as 'active' | 'warning' | 'expired',
      renewalDaysRemaining: 0,
    };

    // Busca o valor de warning em dias da AppConfig
    const warningDays = await this.appConfig.getWarningDays();

    // Lógica de Trial
    if (tenant?.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(tenant.trialEndsAt);
      const trialStart = new Date(tenant.createdAt);
      const totalDays = Math.ceil((trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const percentageRemaining = (daysRemaining / totalDays) * 100;

      status.isTrialActive = daysRemaining > 0;
      status.daysRemaining = Math.max(0, daysRemaining);
      status.percentageRemaining = Math.max(0, Math.min(100, percentageRemaining));

      if (daysRemaining <= 0) {
        status.status = 'expired';
      } else if (daysRemaining <= warningDays) {
        status.status = 'warning';
      }
    }

    // Lógica de Renovação (para planos pagos)
    if (tenant?.renewalAt && !tenant?.trialEndsAt) {
      const now = new Date();
      const renewalDate = new Date(tenant.renewalAt);
      const renewalDaysRemaining = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      status.renewalDaysRemaining = Math.max(0, renewalDaysRemaining);

      // Aviso se estiver próximo da renovação
      if (renewalDaysRemaining <= warningDays && renewalDaysRemaining > 0) {
        status.status = 'warning';
      } else if (renewalDaysRemaining <= 0) {
        status.status = 'expired';
      }
    }

    return status;
  }
}
