"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { templatesApi } from "@/lib/api";

export default function TemplatesListPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuthStore();
  // Captura o locale da rota
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'pt';
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.tenantId) return;
    setLoading(true);
    templatesApi.getAll(user.tenantId)
      .then((data) => setTemplates(data))
      .catch(() => setError("Erro ao carregar templates"))
      .finally(() => setLoading(false));
  }, [user?.tenantId]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Templates</h1>
          <Button onClick={() => router.push(`/${locale}/templates/new`)}>
            Novo Template
          </Button>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Carregando templates...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : templates.length === 0 ? (
          <div className="text-muted-foreground">Nenhum template cadastrado.</div>
        ) : (
          <div className="space-y-4">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="w-full">
                <CardHeader>
                  <CardTitle>{tpl.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono overflow-x-auto">
                    {JSON.stringify(tpl.jsonSchema, null, 2)}
                  </pre>
                  <div className="text-xs text-muted-foreground mt-2">
                    Criado por: {tpl.owner?.name || 'Desconhecido'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
