"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { templatesApi, briefingsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";

export default function BriefingCreatePage() {
  const t = useTranslations();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.tenantId) return;
    setLoadingTemplates(true);
    templatesApi.getAll(user.tenantId)
      .then((data) => setTemplates(data))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, [user?.tenantId]);

  // Simulação de envio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (!user?.tenantId) throw new Error("Tenant não encontrado");
      await briefingsApi.create({
        title: name,
        description,
        templateId,
      }, user.tenantId);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${user.locale || 'pt'}/briefs`);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Erro ao criar briefing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>{t("briefings.create")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="briefing-name">
                Nome do Briefing
              </label>
              <input
                id="briefing-name"
                type="text"
                className="w-full border rounded px-3 py-2 bg-background text-foreground"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="briefing-desc">
                Descrição
              </label>
              <textarea
                id="briefing-desc"
                className="w-full border rounded px-3 py-2 bg-background text-foreground"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="briefing-template">
                Template
              </label>
              {loadingTemplates ? (
                <div className="text-xs text-muted-foreground">Carregando templates...</div>
              ) : (
                <select
                  id="briefing-template"
                  className="w-full border rounded px-3 py-2 bg-background text-foreground"
                  value={templateId}
                  onChange={e => setTemplateId(e.target.value)}
                  required
                >
                  <option value="">Selecione um template</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Briefing"}
              </Button>
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Voltar
              </Button>
            </div>
            {success && <div className="text-green-600 text-sm mt-2">Briefing criado com sucesso!</div>}
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
