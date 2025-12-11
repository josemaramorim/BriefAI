"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth";
import { useTranslations, useLocale } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";

interface AppConfigItem {
  key: string;
  value: string;
  description?: string;
}

export function AdminAppConfig() {
  const t = useTranslations("appConfig");
  const locale = useLocale();
  const [configs, setConfigs] = useState<AppConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    // Garante que o apiClient sempre leia o token atual do auth store
    apiClient.setTokenGetter(() => useAuthStore.getState().token);

    apiClient
      .get<AppConfigItem[]>("/admin/app-config")
      .then((data) => setConfigs(data))
      .catch((err) => {
        console.error("[AdminAppConfig] Erro ao carregar configs:", err);
        setError("Erro ao carregar configurações.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (idx: number, value: string) => {
    setConfigs((prev) => prev.map((item, i) => i === idx ? { ...item, value } : item));
  };

  const handleSave = async (item: AppConfigItem) => {
    setError("");
    setSuccess(false);
    setSavingKey(item.key);
    try {
      await apiClient.put(`/admin/app-config/${item.key}`, {
        value: item.value,
      });
      setSuccess(true);
    } catch {
      setError(`Erro ao salvar ${item.key}`);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl p-4 border rounded bg-white text-sm text-muted-foreground">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="max-w-xl p-4 border rounded bg-card shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-foreground">{t("title")}</h2>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.href = `/${locale}/login`;
            }}
          >
            {t("logout")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {t("subtitle")}
      </p>

      {configs.length === 0 && (
        <div className="text-sm text-muted-foreground">{t("empty")}</div>
      )}

      {configs.map((item, idx) => (
        <div key={item.key} className="mb-4">
          <div className="font-medium text-foreground">
            {(() => {
              const path = `keys.${item.key}.label` as any;
              const translated = t(path);
              return translated === path ? item.key : translated;
            })()}
          </div>
          <div className="text-xs text-muted-foreground mb-1">
            {(() => {
              const path = `keys.${item.key}.description` as any;
              const translated = t(path);
              return translated === path ? item.description : translated;
            })()}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={item.value}
              onChange={e => handleChange(idx, e.target.value)}
              disabled={savingKey === item.key}
              className="w-48 text-foreground bg-background border-input"
            />
            <Button
              onClick={() => handleSave(item)}
              disabled={savingKey === item.key}
              variant={savingKey === item.key ? "outline" : "default"}
            >
              {savingKey === item.key ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      ))}
      {success && <div className="text-green-600 text-sm">Salvo com sucesso!</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
