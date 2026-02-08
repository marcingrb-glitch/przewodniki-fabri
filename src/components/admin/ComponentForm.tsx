import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";

export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "json" | "textarea" | "boolean" | "colors";
  required?: boolean;
  options?: { value: string; label: string }[];
  hidden?: boolean;
}

interface Color {
  code: string;
  name: string;
}

function ColorsListEditor({ value, onChange, error }: { value: Color[]; onChange: (colors: Color[]) => void; error?: string }) {
  const [colors, setColors] = useState<Color[]>(value || []);

  useEffect(() => { setColors(value || []); }, [value]);

  const update = (newColors: Color[]) => { setColors(newColors); onChange(newColors); };
  const addColor = () => update([...colors, { code: "", name: "" }]);
  const removeColor = (i: number) => update(colors.filter((_, idx) => idx !== i));
  const updateColor = (i: number, field: "code" | "name", val: string) => {
    const next = [...colors];
    next[i] = { ...next[i], [field]: field === "code" ? val.toUpperCase() : val };
    update(next);
  };

  return (
    <div className="space-y-2">
      {colors.map((color, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="A, B, C..." value={color.code} onChange={(e) => updateColor(i, "code", e.target.value)} className="w-20" maxLength={1} />
          <Input placeholder="Sand, Cement..." value={color.name} onChange={(e) => updateColor(i, "name", e.target.value)} className="flex-1" />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeColor(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addColor} className="w-full"><Plus className="h-4 w-4 mr-1" /> Dodaj kolor</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function validateColors(colors: Color[]): string | null {
  if (!colors || colors.length === 0) return "Dodaj przynajmniej jeden kolor";
  for (const c of colors) {
    if (!c.code || !c.name) return "Wszystkie kolory muszą mieć kod i nazwę";
    if (!/^[A-Z]$/.test(c.code)) return "Kod koloru musi być pojedynczą literą A-Z";
  }
  const codes = colors.map((c) => c.code);
  if (new Set(codes).size !== codes.length) return "Kody kolorów muszą być unikalne";
  return null;
}

interface ComponentFormProps {
  open: boolean;
  title: string;
  fields: FieldDefinition[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ComponentForm({ open, title, fields, initialData, onSubmit, onCancel, isLoading }: ComponentFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, any> = {};
      fields.forEach((f) => {
        if (initialData && initialData[f.name] !== undefined) {
          if (f.type === "json") initial[f.name] = JSON.stringify(initialData[f.name], null, 2);
          else if (f.type === "colors") initial[f.name] = Array.isArray(initialData[f.name]) ? initialData[f.name] : [];
          else initial[f.name] = initialData[f.name];
        } else {
          initial[f.name] = f.type === "number" ? "" : f.type === "boolean" ? "false" : f.type === "colors" ? [] : "";
        }
      });
      setFormData(initial);
      setErrors({});
    }
  }, [open, initialData, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    const result: Record<string, any> = {};

    for (const f of fields) {
      const val = formData[f.name];
      if (f.type === "colors") {
        const colorsVal = val as Color[] || [];
        if (f.required) {
          const err = validateColors(colorsVal);
          if (err) { newErrors[f.name] = err; continue; }
        }
        result[f.name] = [...colorsVal].sort((a, b) => a.code.localeCompare(b.code));
        continue;
      }
      if (f.required && (val === "" || val === undefined || val === null)) {
        newErrors[f.name] = "Pole wymagane";
        continue;
      }
      if (f.type === "json" && val) {
        try { result[f.name] = JSON.parse(val); } catch { newErrors[f.name] = "Nieprawidłowy JSON"; continue; }
      } else if (f.type === "number" && val !== "") {
        result[f.name] = Number(val);
      } else if (f.type === "boolean") {
        result[f.name] = val === "true";
      } else {
        result[f.name] = val;
      }
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    await onSubmit(result);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          {fields.filter((f) => !f.hidden).map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label>{f.label}{f.required && " *"}</Label>
              {f.type === "colors" ? (
                <ColorsListEditor value={formData[f.name] || []} onChange={(c) => handleChange(f.name, c)} error={errors[f.name]} />
              ) : f.type === "select" ? (
                <Select value={formData[f.name] ?? ""} onValueChange={(v) => handleChange(f.name, v)}>
                  <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.type === "boolean" ? (
                <Select value={String(formData[f.name] ?? "false")} onValueChange={(v) => handleChange(f.name, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Tak</SelectItem>
                    <SelectItem value="false">Nie</SelectItem>
                  </SelectContent>
                </Select>
              ) : f.type === "json" || f.type === "textarea" ? (
                <Textarea rows={4} value={formData[f.name] ?? ""} onChange={(e) => handleChange(f.name, e.target.value)} className="font-mono text-sm" />
              ) : (
                <Input type={f.type === "number" ? "number" : "text"} value={formData[f.name] ?? ""} onChange={(e) => handleChange(f.name, e.target.value)} />
              )}
              {f.type !== "colors" && errors[f.name] && <p className="text-sm text-destructive">{errors[f.name]}</p>}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>Anuluj</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Zapisz" : "Dodaj"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
