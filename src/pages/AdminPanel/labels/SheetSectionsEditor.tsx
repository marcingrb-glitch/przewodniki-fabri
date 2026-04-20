import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, X, ArrowUp, ArrowDown } from "lucide-react";
import ComponentSelector from "./ComponentSelector";
import { COMPONENT_FIELDS } from "./DisplayFieldsSelector";
import type { Section, SectionStyle } from "@/utils/pdfGenerators/labelsV2";

const STYLE_OPTIONS: { value: SectionStyle; label: string }[] = [
  { value: "plain", label: "Tekst (linie)" },
  { value: "bullet_list", label: "Punkty (bullety)" },
  { value: "table", label: "Tabela" },
  { value: "diagram_box", label: "Diagram (kwadrat + etykiety)" },
  { value: "legs_list", label: "Nogi (lista + linia odcięcia)" },
];

const NO_CONDITION = "__none__";
const CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: NO_CONDITION, label: "(brak)" },
  { value: "has_special_notes", label: "Gdy uwagi specjalne" },
  { value: "has_chaise", label: "Gdy jest szezlong" },
  { value: "extras_pufa_fotel", label: "Gdy pufa/fotel" },
];

const NO_FIELD = "__none__";

interface Props {
  sections: Section[];
  productType: string;
  onChange: (sections: Section[]) => void;
}

function normalizeLines(fields: unknown): string[][] {
  if (!Array.isArray(fields) || fields.length === 0) return [[]];
  if (typeof fields[0] === "string") return [fields as string[]];
  return fields as string[][];
}

export default function SheetSectionsEditor({ sections, productType, onChange }: Props) {
  const update = (idx: number, patch: Partial<Section>) => {
    const next = [...sections];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(sections.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const addSection = () => {
    onChange([
      ...sections,
      {
        title: "Nowa sekcja",
        component: "seat",
        style: "plain",
        display_fields: [[]],
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Sekcje ({sections.length})</Label>
        <Button size="sm" variant="outline" onClick={addSection}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Dodaj sekcję
        </Button>
      </div>

      {sections.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Brak sekcji. Dodaj pierwszą sekcję, aby zacząć.
        </p>
      )}

      {sections.map((section, idx) => (
        <Card key={idx} className="border-muted">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground w-6">#{idx + 1}</span>
              <Input
                value={section.title ?? ""}
                onChange={(e) => update(idx, { title: e.target.value || undefined })}
                placeholder="Tytuł sekcji (opcjonalnie)"
                className="h-8 text-sm flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === 0}
                onClick={() => move(idx, -1)}
                title="W górę"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === sections.length - 1}
                onClick={() => move(idx, 1)}
                title="W dół"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => remove(idx)}
                title="Usuń sekcję"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Komponent</Label>
                <ComponentSelector
                  value={section.component}
                  productType={productType}
                  onChange={(v) => update(idx, { component: v })}
                />
              </div>
              <div>
                <Label className="text-xs">Styl</Label>
                <Select
                  value={section.style}
                  onValueChange={(v) => update(idx, { style: v as SectionStyle })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Warunek</Label>
                <Select
                  value={section.condition_field ?? NO_CONDITION}
                  onValueChange={(v) => update(idx, { condition_field: v === NO_CONDITION ? undefined : v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {section.style === "diagram_box" ? (
              <DiagramBoxEditor section={section} onChange={(patch) => update(idx, patch)} />
            ) : section.style === "legs_list" ? (
              <p className="text-xs text-muted-foreground px-2 py-3">
                Dane pobierane automatycznie z dekodowanego SKU
                (siedzisko · skrzynia · pufa — jeśli PF). Linia odcięcia rysowana przed sekcją.
              </p>
            ) : (
              <LinesEditor
                component={section.component}
                lines={normalizeLines(section.display_fields)}
                onChange={(nextLines) => update(idx, { display_fields: nextLines })}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LinesEditor({
  component,
  lines,
  onChange,
}: {
  component: string;
  lines: string[][];
  onChange: (next: string[][]) => void;
}) {
  const availableFields = COMPONENT_FIELDS[component] || [];

  const updateLine = (lineIdx: number, nextFields: string[]) => {
    const next = [...lines];
    next[lineIdx] = nextFields;
    onChange(next);
  };

  const addLine = () => onChange([...lines, []]);
  const removeLine = (lineIdx: number) => {
    const next = lines.filter((_, i) => i !== lineIdx);
    onChange(next.length > 0 ? next : [[]]);
  };

  const toggleField = (lineIdx: number, fieldValue: string) => {
    const current = lines[lineIdx];
    const next = current.includes(fieldValue)
      ? current.filter((f) => f !== fieldValue)
      : [...current, fieldValue];
    updateLine(lineIdx, next);
  };

  const removeField = (lineIdx: number, fieldValue: string) =>
    updateLine(lineIdx, lines[lineIdx].filter((f) => f !== fieldValue));

  const fieldLabel = (v: string) => availableFields.find((f) => f.value === v)?.label || v;

  return (
    <div>
      <Label className="text-xs text-muted-foreground">Pola (każda linia = osobna linia na etykiecie)</Label>
      <div className="space-y-1 mt-1">
        {lines.map((lineFields, lineIdx) => (
          <div key={lineIdx} className="flex items-start gap-2 py-1 px-2 rounded bg-muted/30">
            <span className="text-xs text-muted-foreground mt-1 shrink-0 w-14">Linia {lineIdx + 1}:</span>
            <div className="flex flex-wrap gap-1 flex-1 min-w-0">
              {lineFields.map((f) => (
                <Badge
                  key={f}
                  variant="secondary"
                  className="text-xs font-normal cursor-pointer hover:bg-destructive/20 pr-1"
                  onClick={() => removeField(lineIdx, f)}
                >
                  {fieldLabel(f)}
                  <X className="h-3 w-3 ml-0.5" />
                </Badge>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                    <Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-2 max-h-[350px] overflow-y-auto" align="start">
                  {availableFields.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Brak pól dla komponentu "{component}"</p>
                  ) : (
                    <div className="space-y-0.5">
                      {availableFields.map((field) => (
                        <label
                          key={field.value}
                          className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer"
                        >
                          <Checkbox
                            checked={lineFields.includes(field.value)}
                            onCheckedChange={() => toggleField(lineIdx, field.value)}
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate">{field.label}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{field.source}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            {lines.length > 1 && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeLine(lineIdx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" className="mt-1 text-xs" onClick={addLine}>
          <Plus className="h-3 w-3 mr-1" /> Dodaj linię
        </Button>
      </div>
    </div>
  );
}

function DiagramBoxEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (patch: Partial<Section>) => void;
}) {
  const availableFields = COMPONENT_FIELDS[section.component] || [];
  const fields = section.fields ?? {};

  const setField = (pos: "top" | "bottom" | "left" | "right" | "center", value: string) => {
    const nextFields = { ...fields, [pos]: value === NO_FIELD ? undefined : value };
    onChange({ fields: nextFields });
  };

  const positions: Array<{ key: "top" | "bottom" | "left" | "right" | "center"; label: string }> = [
    { key: "top", label: "Góra (nad kwadratem)" },
    { key: "bottom", label: "Dół (pod kwadratem)" },
    { key: "left", label: "Lewo" },
    { key: "right", label: "Prawo" },
    { key: "center", label: "Środek (w kwadracie)" },
  ];

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs">Rozmiar kwadratu (mm)</Label>
        <Input
          type="number"
          value={section.box_size_mm ?? 50}
          onChange={(e) => onChange({ box_size_mm: parseInt(e.target.value) || 50 })}
          className="h-8 text-xs w-24"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {positions.map(({ key, label }) => (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <Select value={fields[key] ?? NO_FIELD} onValueChange={(v) => setField(key, v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_FIELD} className="text-xs">(brak)</SelectItem>
                {availableFields.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
