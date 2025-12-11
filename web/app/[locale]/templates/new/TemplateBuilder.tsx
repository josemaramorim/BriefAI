import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FieldModal from "./FieldModal";

export type TemplateField = {
  id: string;
  name: string;
  type: "text" | "number" | "select";
  required: boolean;
  options?: string[];
};

export default function TemplateBuilder({ onSave }: { onSave: (fields: TemplateField[], title: string) => void }) {
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [title, setTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editField, setEditField] = useState<TemplateField | null>(null);

  function handleAddField(field: TemplateField) {
    if (editField) {
      setFields(fields.map(f => f.id === editField.id ? field : f));
      setEditField(null);
    } else {
      setFields([...fields, field]);
    }
    setShowModal(false);
  }

  function handleEditField(field: TemplateField) {
    setEditField(field);
    setShowModal(true);
  }

  function handleRemoveField(id: string) {
    setFields(fields.filter(f => f.id !== id));
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Criar Template Visual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Título do Template</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 bg-background text-foreground"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <Button variant="outline" type="button" onClick={() => { setEditField(null); setShowModal(true); }}>
              Adicionar campo
            </Button>
          </div>
          <div className="space-y-2">
            {fields.length === 0 ? (
              <div className="text-muted-foreground text-sm">Nenhum campo adicionado.</div>
            ) : (
              fields.map(field => (
                <div key={field.id} className="border rounded px-3 py-2 flex items-center justify-between gap-2">
                  <span>{field.name} ({field.type}) {field.required ? "*" : ""}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" type="button" onClick={() => handleEditField(field)}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" type="button" onClick={() => handleRemoveField(field.id)}>
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-6">
            <Button type="button" onClick={() => onSave(fields, title)} disabled={fields.length === 0 || !title}>
              Salvar Template
            </Button>
          </div>
        </CardContent>
      </Card>
      {showModal && (
        <FieldModal
          onSave={handleAddField}
          onClose={() => { setShowModal(false); setEditField(null); }}
          {...(editField ? { ...editField } : {})}
        />
      )}
    </div>
  );
}
