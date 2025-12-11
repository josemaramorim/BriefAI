"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { billingApi } from '@/lib/api';

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: string) => {
    setLoading(plan);
    try {
      const response = await billingApi.upgradePlan(plan);
      toast({
        title: 'Plano atualizado!',
        description: response.message,
        variant: 'success',
      });
      // Redirecionar para billing após sucesso
      // router.push('/billing');
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar plano',
        description: error?.response?.data?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Ver Planos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Exemplo de planos - pode ser dinâmico depois */}
        <Card>
          <CardHeader>
            <CardTitle>Starter</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 text-sm">
              <li>Até 10 briefings</li>
              <li>Até 5 templates</li>
              <li>Até 3 usuários</li>
              <li>100MB de armazenamento</li>
            </ul>
            <Button variant="default" onClick={() => handleSelectPlan('Starter')} disabled={loading === 'Starter'}>
              {loading === 'Starter' ? 'Selecionando...' : 'Selecionar'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 text-sm">
              <li>Briefings ilimitados</li>
              <li>Templates ilimitados</li>
              <li>Usuários ilimitados</li>
              <li>10GB de armazenamento</li>
            </ul>
            <Button variant="default" onClick={() => handleSelectPlan('Pro')} disabled={loading === 'Pro'}>
              {loading === 'Pro' ? 'Selecionando...' : 'Selecionar'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 text-sm">
              <li>Recursos personalizados</li>
              <li>Suporte dedicado</li>
              <li>Armazenamento sob demanda</li>
            </ul>
            <Button variant="default" onClick={() => handleSelectPlan('Enterprise')} disabled={loading === 'Enterprise'}>
              {loading === 'Enterprise' ? 'Solicitando...' : 'Solicitar Contato'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Teste/Boleto Simulado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 text-sm">
              <li>Plano para testes</li>
              <li>Pagamento simulado</li>
              <li>Liberação imediata</li>
            </ul>
            <Button variant="default" onClick={() => handleSelectPlan('Teste')}
              disabled={loading === 'Teste'}>
              {loading === 'Teste' ? 'Liberando...' : 'Simular Pagamento'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
