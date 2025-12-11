"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Assinatura</h1>
      <Card>
        <CardHeader>
          <CardTitle>Assinatura Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm">
            <div><strong>Plano:</strong> Starter</div>
            <div><strong>Status:</strong> Ativo</div>
            <div><strong>Renovação:</strong> 10/12/2026</div>
          </div>
          <div className="flex gap-2">
            <Button variant="default">Renovar</Button>
            <Button variant="outline">Alterar Plano</Button>
            <Button variant="destructive">Cancelar</Button>
          </div>
        </CardContent>
      </Card>
      {/* Histórico de pagamentos, etc, pode ser adicionado depois */}
    </div>
  );
}
