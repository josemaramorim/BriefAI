"use client"

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlanStatusAlert } from '@/components/plan-status-alert';

import type { DashboardMetrics } from '@/lib/api/types';

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { user, isAuthenticated } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let triedRestore = false;
    async function checkAuthAndLoad() {
      if (!isAuthenticated || !user?.tenantId) {
        if (!triedRestore) {
          triedRestore = true;
          await useAuthStore.getState().loadUser();
          // Recheca após restaurar
          if (!useAuthStore.getState().isAuthenticated || !useAuthStore.getState().user?.tenantId) {
            router.push('/login');
            return;
          }
        } else {
          router.push('/login');
          return;
        }
      }
      const tenantId = useAuthStore.getState().user?.tenantId;
      if (!tenantId) return;
      try {
        const data = await dashboardApi.getMetrics(tenantId);
        setMetrics(data);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.tenantId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Assume 5GB storage limit (could be configured in backend)
  const storageLimit = 5 * 1024 * 1024 * 1024; // 5GB in bytes
  const storagePercentage = (metrics.storage.totalSize / storageLimit) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/login');
              }}
            >
              {t('auth.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Alerta de status do plano/trial */}
          {metrics?.plan && (
            <PlanStatusAlert
              planName={metrics.plan.planName}
              trialEndsAt={metrics.plan.trialEndsAt}
              isTrialActive={metrics.plan.isTrialActive}
              daysRemaining={metrics.plan.daysRemaining}
              percentageRemaining={metrics.plan.percentageRemaining}
              status={metrics.plan.status}
            />
          )}

          {/* Cards de métricas existentes */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.briefings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.briefings.total}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.briefings.inProgress} em progresso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.templates')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.templates.total}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.templates.published} publicados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.collaborations')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.collaborations.totalCollaborators}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.collaborations.activeCollaborators} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.storage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.storage.totalSize / (1024 * 1024)).toFixed(1)} MB
                </div>
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {storagePercentage.toFixed(1)}% de{' '}
                    {(storageLimit / (1024 * 1024 * 1024)).toFixed(0)} GB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/briefs/new`)}
                >
                  Criar Novo Briefing
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/briefs`)}
                >
                  Ver Todos os Briefings
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/templates`)}
                >
                  Gerenciar Templates
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade recente
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
