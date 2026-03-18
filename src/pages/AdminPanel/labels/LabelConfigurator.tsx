import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2 } from "lucide-react";
import { COMPONENT_FIELDS } from "./DisplayFieldsSelector";
import { useLabelSettings, type LabelSettingsData } from "./LabelSettings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { formatFieldWithLabel } from "@/utils/fieldLabels";
import { resolveDecodedField } from "@/utils/pdfGenerators/decodingFieldResolver";
import { useSkuPreviewDecoder } from "./useSkuPreviewDecoder";
import { DEFAULT_EXAMPLE_SKUS, FALLBACK_EXAMPLE_SKU } from "./defaultExampleSkus";
import LabelPdfPreview from "./LabelPdfPreview";
import type { LabelSettings as LabelSettingsType } from "@/utils/pdfHelpers";

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
  previewSeriesCode?: string;
}

function toLabelSettings(db: LabelSettingsData): LabelSettingsType {
  return {
    leftZoneWidth: db.left_zone_width,
    leftZoneFields: db.left_zone_fields,
    headerTemplate: db.header_template,
    seriesCodeSize: db.series_code_size,
    seriesNameSize: db.series_name_size,
    seriesCollectionSize: db.series_collection_size,
    contentMaxSize: db.content_max_size,
    contentMinSize: db.content_min_size,
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
  previewSeriesCode,
}: LabelConfiguratorProps) {
  const lines = useMemo(() => normalizeFields(template.display_fields), [template.display_fields]);
  const { data: labelSettings } = useLabelSettings();

  const defaultSku = DEFAULT_EXAMPLE_SKUS[previewSeriesCode || "S1"] || FALLBACK_EXAMPLE_SKU;
  const { decoded, isLoading: decoderLoading, error: decoderError, skuInput, setSkuInput } = useSkuPreviewDecoder(defaultSku);

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

  // Build content lines from decoded SKU
  const previewLines = useMemo(() => {
    if (!decoded) return [];
    const result: string[] = [];
    for (const lineFields of lines) {
      const parts = lineFields
        .map((f) => {
          const val = resolveDecodedField(f, decoded);
          if (val === "-") return null;
          return formatFieldWithLabel(f, val);
        })
        .filter(Boolean) as string[];
      if (parts.length > 0) {
        result.push(parts.join(" | "));
      }
    }
    return result;
  }, [lines, decoded]);

  // Build full label lines for PDF preview (matching labels.ts buildLabelLines)
  const pdfPreviewLines = useMemo(() => {
    if (!decoded || !labelSettings) return [];
    const settings = toLabelSettings(labelSettings);

    const seriesParts = settings.leftZoneFields.map((field) => {
      switch (field) {
        case "series.code": return decoded.series.code || "";
        case "series.name": return decoded.series.name || "";
        case "series.collection": return decoded.series.collection || "";
        case "product_type": return template.product_type.toUpperCase();
        case "order_number": return decoded.orderNumber || "12345";
        default: return "";
      }
    });
    const seriesLine = seriesParts.join("|");

    const headerTemplate = settings.headerTemplate?.trim()
      ? settings.headerTemplate
      : "{TYPE} | {LABEL} | {ORDER}";

    const header = headerTemplate
      .replace("{TYPE}", template.product_type.toUpperCase())
      .replace("{LABEL}", template.label_name)
      .replace("{ORDER}", decoded.orderNumber || "12345");

    return [seriesLine, header, ...previewLines];
  }, [decoded, labelSettings, previewLines, template]);

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
        {/* SKU Input + PDF Preview */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Podgląd etykiety
          </p>
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-xs text-muted-foreground shrink-0">SKU podglądu:</Label>
            <Input
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              placeholder="Wpisz SKU..."
              className="h-7 text-xs font-mono flex-1"
            />
            {decoderLoading && <span className="text-xs text-muted-foreground animate-pulse">dekodowanie...</span>}
            {decoderError && <span className="text-xs text-destructive truncate max-w-[200px]" title={decoderError}>⚠ {decoderError}</span>}
          </div>
          {labelSettings && pdfPreviewLines.length > 0 ? (
            <LabelPdfPreview
              lines={pdfPreviewLines}
              settings={toLabelSettings(labelSettings)}
              width={500}
              height={150}
            />
          ) : (
            <div className="border rounded bg-muted/30 flex items-center justify-center" style={{ width: 500, height: 150 }}>
              <span className="text-xs text-muted-foreground">
                {decoderLoading ? "Dekodowanie SKU..." : "Wpisz poprawne SKU aby zobaczyć podgląd"}
              </span>
            </div>
          )}
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
              „{(labelSettings?.header_template || "{TYPE} | {LABEL} | {ORDER}")
                .replace("{TYPE}", productLabel)
                .replace("{LABEL}", template.label_name)
                .replace("{ORDER}", "12345")}"
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
