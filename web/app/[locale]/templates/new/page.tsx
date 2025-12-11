"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { templatesApi } from "@/lib/api";
import TemplateBuilder, { TemplateField } from "./TemplateBuilder";

export default function TemplateCreatePage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Função para gerar JSON Schema a partir dos campos
  function buildJsonSchema(fields: TemplateField[]) {
    const properties: Record<string, any> = {};
    fields.forEach(field => {
      if (field.type === "select") {
        properties[field.name] = {
          type: "string",
          enum: field.options || []
        };
      } else {
        properties[field.name] = {
          type: field.type === "number" ? "number" : "string"
        };
      }
      if (field.required) {
        properties[field.name].required = true;
      }
    });
    return {
      type: "object",
      properties
    };
  }

  async function handleSave(fields: TemplateField[], title: string) {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (!user?.tenantId) throw new Error("Tenant não encontrado");
      await templatesApi.create({
        title,
        jsonSchema: buildJsonSchema(fields),
      }, user.tenantId);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${user.locale || 'pt'}/templates`);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Erro ao criar template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <TemplateBuilder onSave={handleSave} />
      {success && <div className="text-green-600 text-sm mt-2">Template criado com sucesso!</div>}
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
    </div>
  );
}
