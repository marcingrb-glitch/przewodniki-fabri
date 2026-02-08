import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "json" | "textarea" | "boolean";
  required?: boolean;
  options?: { value: string; label: string }[];
  hidden?: boolean;
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
          initial[f.name] = f.type === "json" ? JSON.stringify(initialData[f.name], null, 2) : initialData[f.name];
        } else {
          initial[f.name] = f.type === "number" ? "" : f.type === "boolean" ? "false" : "";
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
              {f.type === "select" ? (
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
              {errors[f.name] && <p className="text-sm text-destructive">{errors[f.name]}</p>}
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
