"use client";
import ModalBase from '@/components/ui/ModalBase';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CustomSelect from '@/components/ui/CustomSelect';

export type FieldModalProps = {
  onSave: (field: {
    id: string;
    name: string;
    type: "text" | "number" | "select";
    required: boolean;
    options?: string[];
  }) => void;
  onClose: () => void;
};

export default function FieldModal({ onSave, onClose, ...editField }: FieldModalProps & Partial<import("./TemplateBuilder").TemplateField>) {
  const [name, setName] = useState(editField.name || "");
  const [type, setType] = useState<"text" | "number" | "select">(editField.type || "text");
  const [required, setRequired] = useState(editField.required || false);
  const [options, setOptions] = useState<string>(editField.options ? editField.options.join(",") : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const field = {
      id: editField.id || Math.random().toString(36).slice(2),
      name,
      type,
      required,
      options: type === "select" ? options.split(",").map(o => o.trim()).filter(Boolean) : undefined,
    };
    onSave(field);
    onClose();
  }

  return (
    <ModalBase open={true} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold mb-2">Adicionar campo</h2>
        <div>
          <label className="block text-sm mb-1">Nome do campo</label>
          <input type="text" className="w-full border rounded px-2 py-1 bg-background text-foreground" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <CustomSelect
            value={type}
            onChange={v => setType(v as any)}
            options={[
              { value: "text", label: "Texto" },
              { value: "number", label: "Número" },
              { value: "select", label: "Seleção" },
            ]}
          />
        </div>
        {type === "select" && (
          <div>
            <label className="block text-sm mb-1">Opções (separadas por vírgula)</label>
            <input type="text" className="w-full border rounded px-2 py-1 bg-background text-foreground" value={options} onChange={e => setOptions(e.target.value)} required />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="required" checked={required} onChange={e => setRequired(e.target.checked)} />
          <label htmlFor="required" className="text-sm">Obrigatório</label>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="submit">Salvar</Button>
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </ModalBase>
  );
}
