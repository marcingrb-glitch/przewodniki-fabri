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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatFieldWithLabel } from "@/utils/fieldLabels";

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

// Fetch real example data from DB
function useExampleData() {
  return useQuery({
    queryKey: ["label-example-data"],
    queryFn: async () => {
      const [seatRes, sideRes, backrestRes, chestRes, automatRes, seriesRes, legRes, pufaSeatRes, pillowRes, finishRes, legsRes] = await Promise.all([
        supabase.from("products").select("code, name, properties").eq("category", "seat").eq("active", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name, properties").eq("category", "side").eq("active", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name, properties").eq("category", "backrest").eq("active", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name, properties").eq("category", "chest").eq("is_global", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name, properties").eq("category", "automat").eq("is_global", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name, properties").eq("category", "series").eq("active", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name, properties, colors").eq("category", "leg").eq("is_global", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name, properties").eq("category", "seat_pufa").eq("active", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name").eq("category", "pillow").eq("is_global", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name").eq("category", "finish").eq("is_global", true).limit(1).maybeSingle(),
        supabase.from("products").select("code, name, properties, colors").eq("category", "leg").eq("is_global", true).limit(1).maybeSingle(),
      ]);
      return {
        seat: seatRes.data ? { ...seatRes.data, ...(seatRes.data as any).properties } : null,
        side: sideRes.data ? { ...sideRes.data, ...(sideRes.data as any).properties } : null,
        backrest: backrestRes.data ? { ...backrestRes.data, ...(backrestRes.data as any).properties } : null,
        chest: chestRes.data ? { ...chestRes.data, ...(chestRes.data as any).properties } : null,
        automat: automatRes.data ? { ...automatRes.data, ...(automatRes.data as any).properties } : null,
        series: seriesRes.data ? { ...seriesRes.data, collection: (seriesRes.data as any).properties?.collection } : null,
        leg: legRes.data ? { ...legRes.data, ...(legRes.data as any).properties } : null,
        pufaSeat: pufaSeatRes.data ? { ...pufaSeatRes.data, ...(pufaSeatRes.data as any).properties } : null,
        pillow: pillowRes.data,
        finish: finishRes.data,
        legs: legsRes.data ? { ...legsRes.data, ...(legsRes.data as any).properties } : null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

function buildExampleValues(data: ReturnType<typeof useExampleData>["data"]): Record<string, string> {
  if (!data) return {};
  const v = (val: unknown, fallback = "(brak)") => (val != null && val !== "" ? String(val) : fallback);
  const finishCode = v(data.finish?.code, "A");
  const finishName = v(data.finish?.name, "Zwykły");
  // Extract first color from legs.colors if available
  let legColor = "(brak)";
  let legColorName = "(brak)";
  if (data.legs?.colors && Array.isArray(data.legs.colors) && (data.legs.colors as any[]).length > 0) {
    const first = (data.legs.colors as any[])[0];
    legColor = first?.code || "(brak)";
    legColorName = first?.name || "(brak)";
  }

  return {
    "seat.code": v(data.seat?.code),
    "seat.type": v(data.seat?.type),
    "seat.frame": v(data.seat?.frame),
    "seat.foamsList": "—",
    "seat.front": v(data.seat?.front),
    "seat.finish": finishCode,
    "seat.finishName": finishName,
    "seat.midStrip": data.seat?.center_strip ? "Tak" : "Nie",
    "seat.springType": v(data.seat?.spring_type),
    "automat.code": v(data.automat?.code),
    "automat.name": v(data.automat?.name),
    "automat.type": v(data.automat?.type),
    "side.code": v(data.side?.code),
    "side.name": v(data.side?.name),
    "side.frame": v(data.side?.frame),
    "side.finish": finishCode,
    "side.finishName": finishName,
    "backrest.code": v(data.backrest?.code),
    "backrest.height": v(data.backrest?.height_cm),
    "backrest.frame": v(data.backrest?.frame),
    "backrest.foamsList": "—",
    "backrest.top": v(data.backrest?.top),
    "backrest.finish": finishCode,
    "backrest.finishName": finishName,
    "backrest.springType": v(data.backrest?.spring_type),
    "chest.code": v(data.chest?.code),
    "chest.name": v(data.chest?.name),
    "chest.legHeight": v(data.chest?.leg_height_cm),
    "chest.legCount": v(data.chest?.leg_count),
    "legHeights.sofa_chest.leg": v(data.leg?.name),
    "legHeights.sofa_chest.height": v(data.chest?.leg_height_cm),
    "legHeights.sofa_chest.count": v(data.chest?.leg_count),
    "legHeights.sofa_seat.leg": v(data.leg?.name),
    "legHeights.sofa_seat.height": "(brak)",
    "legHeights.sofa_seat.count": "(brak)",
    "leg.code": v(data.leg?.name),
    "leg.height": v(data.chest?.leg_height_cm),
    "leg.count": v(data.chest?.leg_count),
    "pufaLegs.code": v(data.leg?.code),
    "pufaLegs.height": "(brak)",
    "pufaLegs.count": "(brak)",
    "fotelLegs.code": v(data.leg?.code),
    "fotelLegs.height": "(brak)",
    "fotelLegs.count": "(brak)",
    "pufaSeat.frontBack": v(data.pufaSeat?.front_back),
    "pufaSeat.sides": v(data.pufaSeat?.sides),
    "pufaSeat.foam": v(data.pufaSeat?.base_foam),
    "pufaSeat.box": v(data.pufaSeat?.box_height),
    "pillow.code": v(data.pillow?.code),
    "pillow.name": v(data.pillow?.name),
    "pillow.finish": finishCode,
    "pillow.finishName": finishName,
    "legs.code": v(data.legs?.code),
    "legs.name": v(data.legs?.name),
    "legs.material": v(data.legs?.material),
    "legs.color": legColor,
    "legs.colorName": legColorName,
  };
}

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
  const { data: exampleData } = useExampleData();
  const exampleValues = useMemo(() => buildExampleValues(exampleData), [exampleData]);

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

  const previewLines = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const lineFields = lines[i];
      const parts = lineFields
        .map((f) => {
          const val = exampleValues[f] || "(brak)";
          if (val === "-") return null;
          return formatFieldWithLabel(f, val);
        })
        .filter(Boolean) as string[];
      if (parts.length > 0) {
        result.push(parts.join(" | "));
      }
    }
    return result;
  }, [lines, template.label_name, exampleValues]);

  // Left zone fields from settings
  const LEFT_FIELD_EXAMPLES: Record<string, string> = {
    "series.code": exampleData?.series?.code || "(brak)",
    "series.name": exampleData?.series?.name || "(brak)",
    "series.collection": exampleData?.series?.collection || "(brak)",
    "product_type": productLabel,
    "order_number": "12345",
  };

  const leftFields = labelSettings?.left_zone_fields || ["series.code", "series.name", "series.collection"];
  const leftZoneWidthPx = ((labelSettings?.left_zone_width || 16) / 100) * 400;

  const headerText = (labelSettings?.header_template || "{TYPE} | {LABEL} | {ORDER}")
    .replace("{TYPE}", productLabel)
    .replace("{LABEL}", template.label_name)
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
              „{headerText}"
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
