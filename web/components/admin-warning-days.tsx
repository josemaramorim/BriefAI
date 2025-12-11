"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminWarningDays({ token }: { token: string }) {
  const [value, setValue] = useState(3);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/admin/app-config/warning-days", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setValue(data.warning_days))
      .catch(() => setError("Erro ao carregar valor atual."));
  }, [token]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/admin/app-config/warning-days", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
    } catch {
      setError("Erro ao salvar valor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md p-4 border rounded bg-white">
      <h2 className="font-bold mb-2">Configuração: Dias para Warning</h2>
      <div className="flex items-center gap-2 mb-2">
        <Input
          type="number"
          min={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-24"
        />
        <Button onClick={handleSave} disabled={loading}>
          Salvar
        </Button>
      </div>
      {success && <div className="text-green-600 text-sm">Salvo com sucesso!</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="text-xs text-muted-foreground mt-2">
        Define em quantos dias antes do fim do trial ou renovação o sistema mostra o alerta amarelo.
      </div>
    </div>
  );
}
