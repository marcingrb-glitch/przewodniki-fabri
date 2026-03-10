import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Trash2 } from "lucide-react";
import { COMPONENT_FIELDS } from "./DisplayFieldsSelector";
import { useLabelSettings, type LabelSettingsData } from "./LabelSettings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface LabelTemplate {
  id: string;
  product_type: string;
  label_name: string;
  component: string;
  display_fields: string[];
  quantity: number;
}

interface LabelConfiguratorProps {
  template: LabelTemplate;
  onFieldsChange: (fields: string[][]) => void;
  onClose: () => void;
}

// Example data for preview
const EXAMPLE_VALUES: Record<string, string> = {
  "seat.code": "S1-01",
  "seat.type": "N",
  "seat.frame": "Rama 120x80",
  "seat.foamsList": "HR35 120x60x10\nT25 120x60x5",
  "seat.front": "Front 120",
  "seat.finish": "M",
  "seat.finishName": "Matowy",
  "seat.midStrip": "Tak",
  "seat.springType": "Bonell",
  "automat.code": "A1",
  "automat.name": "Automat DL",
  "automat.type": "DL",
  "side.code": "B1",
  "side.name": "Boczek prosty",
  "side.frame": "Rama boczka",
  "side.finish": "M",
  "side.finishName": "Matowy",
  "backrest.code": "O1",
  "backrest.height": "45",
  "backrest.frame": "Rama oparcia",
  "backrest.foamsList": "HR30 60x40x8",
  "backrest.top": "Gładki",
  "backrest.finish": "P",
  "backrest.finishName": "Pikowany",
  "backrest.springType": "Fala",
  "chest.code": "SK1",
  "chest.name": "Skrzynia std",
  "chest.legHeight": "5",
  "chest.legCount": "4",
  "legHeights.sofa_chest.leg": "Nóżka okrągła",
  "legHeights.sofa_chest.height": "5",
  "legHeights.sofa_chest.count": "4",
  "legHeights.sofa_seat.leg": "Nóżka kwadrat",
  "legHeights.sofa_seat.height": "3",
  "legHeights.sofa_seat.count": "6",
  "leg.code": "Nóżka okrągła",
  "leg.height": "5",
  "leg.count": "4",
  "pufaLegs.code": "NP1",
  "pufaLegs.height": "8",
  "pufaLegs.count": "4",
  "fotelLegs.code": "NF1",
  "fotelLegs.height": "12",
  "fotelLegs.count": "4",
  "pufaSeat.frontBack": "50x40",
  "pufaSeat.sides": "40x30",
  "pufaSeat.foam": "HR35",
  "pufaSeat.box": "15",
  "pillow.code": "P1",
  "pillow.name": "Poduszka std",
  "pillow.finish": "G",
  "pillow.finishName": "Gładka",
  "legs.code": "L1",
  "legs.name": "Nóżka chrom",
  "legs.material": "Metal",
  "legs.color": "CH",
  "legs.colorName": "Chrom",
};

/** Normalize display_fields: flat string[] → string[][], nested stays as-is */
function normalizeFields(fields: unknown): string[][] {
  if (!Array.isArray(fields) || fields.length === 0) return [[]];
  if (typeof fields[0] === "string") return [fields as string[]];
  return fields as string[][];
}

function getFieldLabel(fieldValue: string, component: string): string {
  const componentFields = COMPONENT_FIELDS[component] || [];
  const found = componentFields.find((f) => f.value === fieldValue);
  return found?.label || fieldValue;
}

export default function LabelConfigurator({
  template,
  onFieldsChange,
  onClose,
}: LabelConfiguratorProps) {
  const lines = useMemo(() => normalizeFields(template.display_fields), [template.display_fields]);
  const { data: labelSettings } = useLabelSettings();

  const productLabel = template.product_type.toUpperCase();
  const availableFields = COMPONENT_FIELDS[template.component] || [];

  const updateLine = (lineIdx: number, newFields: string[]) => {
    const next = [...lines];
    next[lineIdx] = newFields;
    onFieldsChange(next);
  };

  const addLine = () => {
    onFieldsChange([...lines, []]);
  };

  const removeLine = (lineIdx: number) => {
    const next = lines.filter((_, i) => i !== lineIdx);
    onFieldsChange(next.length > 0 ? next : [[]]);
  };

  const toggleField = (lineIdx: number, fieldValue: string) => {
    const current = lines[lineIdx];
    const next = current.includes(fieldValue)
      ? current.filter((f) => f !== fieldValue)
      : [...current, fieldValue];
    updateLine(lineIdx, next);
  };

  const removeField = (lineIdx: number, fieldValue: string) => {
    updateLine(lineIdx, lines[lineIdx].filter((f) => f !== fieldValue));
  };

  // Build preview lines
  const previewLines = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const lineFields = lines[i];
      const values = lineFields
        .map((f) => EXAMPLE_VALUES[f] || "???")
        .filter((v) => v !== "-");
      const prefix = i === 0 ? `${template.label_name}: ` : "";
      if (values.length > 0 || i === 0) {
        result.push(`${prefix}${values.join(" ")}`);
      }
    }
    return result;
  }, [lines, template.label_name]);

  // Left zone fields from settings
  const LEFT_FIELD_EXAMPLES: Record<string, string> = {
    "series.code": "S1",
    "series.name": "Sofa Mar",
    "series.collection": "Vienne",
    "product_type": productLabel,
    "order_number": "12345",
  };

  const leftFields = labelSettings?.left_zone_fields || ["series.code", "series.name", "series.collection"];
  const leftZoneWidthPx = ((labelSettings?.left_zone_width || 16) / 100) * 400;

  const headerText = (labelSettings?.header_template || "{TYPE} | Zam: {ORDER}")
    .replace("{TYPE}", productLabel)
    .replace("{ORDER}", "12345");

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">
          Konfigurator: „{template.label_name}"
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Preview */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Podgląd etykiety
          </p>
          <div
            className="border rounded bg-background inline-flex overflow-hidden"
            style={{ width: 400, height: 120 }}
          >
            {/* Left zone — series info rotated */}
            <div
              className="bg-muted flex items-center justify-center shrink-0 relative"
              style={{ width: leftZoneWidthPx, height: 120 }}
            >
              <div
                className="absolute flex flex-col items-center gap-0.5"
                style={{
                  transform: "rotate(-90deg)",
                  whiteSpace: "nowrap",
                }}
              >
                {leftFields.map((field, i) => {
                  const example = LEFT_FIELD_EXAMPLES[field] || field;
                  const isCode = field === "series.code";
                  const isName = field === "series.name";
                  const fontSize = isCode
                    ? `${Math.min((labelSettings?.series_code_size || 18) * 0.7, 16)}px`
                    : isName
                    ? `${Math.min((labelSettings?.series_name_size || 9) * 0.9, 12)}px`
                    : `${Math.min((labelSettings?.series_collection_size || 7) * 0.9, 10)}px`;
                  return (
                    <span
                      key={i}
                      className={isCode || isName ? "font-bold" : "text-muted-foreground"}
                      style={{ fontSize }}
                    >
                      {field === "series.collection" ? `[${example}]` : example}
                    </span>
                  );
                })}
              </div>
            </div>
            {/* Main zone */}
            <div className="flex-1 px-3 py-2 flex flex-col justify-center gap-0.5 min-w-0">
              <p className="text-xs font-bold truncate">
                {headerText}
              </p>
              {previewLines.map((line, i) => (
                <p key={i} className="text-[11px] truncate leading-tight">
                  {line || <span className="text-muted-foreground italic">pusta linia</span>}
                </p>
              ))}
              {previewLines.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">
                  {template.label_name}: (brak pól)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line builder */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Linie treści
          </p>
          {/* Auto header line */}
          <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-muted/50 mb-1">
            <span className="text-xs text-muted-foreground">Nagłówek (auto):</span>
            <span className="text-xs font-medium">
              „{productLabel} | Zam: &#123;nr&#125;"
            </span>
          </div>

          {/* Configurable lines */}
          {lines.map((lineFields, lineIdx) => (
            <div
              key={lineIdx}
              className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-accent/50 group"
            >
              <span className="text-xs text-muted-foreground mt-1 shrink-0 w-14">
                Linia {lineIdx + 1}:
              </span>
              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                {lineFields.map((f) => (
                  <Badge
                    key={f}
                    variant="secondary"
                    className="text-xs font-normal cursor-pointer hover:bg-destructive/20 pr-1"
                    onClick={() => removeField(lineIdx, f)}
                  >
                    {getFieldLabel(f, template.component)}
                    <X className="h-3 w-3 ml-0.5" />
                  </Badge>
                ))}
                {/* Add field popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-2 max-h-[350px] overflow-y-auto" align="start">
                    {availableFields.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">Brak pól dla tego komponentu</p>
                    ) : (
                      <div className="space-y-0.5">
                        {availableFields.map((field) => {
                          const alreadyUsed = lines.some((l) => l.includes(field.value));
                          return (
                            <label
                              key={field.value}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                                alreadyUsed
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-accent cursor-pointer"
                              }`}
                            >
                              <Checkbox
                                checked={lineFields.includes(field.value)}
                                disabled={alreadyUsed && !lineFields.includes(field.value)}
                                onCheckedChange={() => toggleField(lineIdx, field.value)}
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate">{field.label}</span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {field.source}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              {lines.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                  onClick={() => removeLine(lineIdx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-1 text-xs"
            onClick={addLine}
          >
            <Plus className="h-3 w-3 mr-1" />
            Dodaj linię
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
