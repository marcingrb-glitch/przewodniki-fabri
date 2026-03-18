import { DecodedSKU } from "@/types";
import { createDoc, addLabel, toBlob, LabelSettings } from "@/utils/pdfHelpers";
import { supabase } from "@/integrations/supabase/client";
import { formatFieldWithLabel } from "@/utils/fieldLabels";
import { resolveDecodedField, checkDecodedCondition } from "./decodingFieldResolver";

function seriesLine(decoded: DecodedSKU, leftZoneFields: string[], productType: string): string {
  return leftZoneFields.map((field) => {
    switch (field) {
      case "series.code": return decoded.series.code || "";
      case "series.name": return decoded.series.name || "";
      case "series.collection": return decoded.series.collection || "";
      case "product_type": return productType.toUpperCase();
      case "order_number": return decoded.orderNumber || "";
      default: return "";
    }
  }).join("|");
}

interface LabelTemplate {
  label_name: string;
  component: string;
  display_fields: string[];
  quantity: number;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
}

async function fetchTemplates(
  productType: string,
  seriesCode?: string
): Promise<LabelTemplate[]> {
  // Try series-specific first
  let seriesId: string | null = null;
  if (seriesCode) {
    const { data: series } = await supabase
      .from("products")
      .select("id")
      .eq("category", "series")
      .eq("code", seriesCode)
      .maybeSingle();
    seriesId = series?.id ?? null;
  }

  if (seriesId) {
    const { data } = await supabase
      .from("label_templates")
      .select("label_name, component, display_fields, quantity, sort_order, is_conditional, condition_field")
      .eq("product_type", productType)
      .eq("series_id", seriesId)
      .order("sort_order");
    if (data && data.length > 0) return data as LabelTemplate[];
  }

  // Fall back to global templates
  const { data } = await supabase
    .from("label_templates")
    .select("label_name, component, display_fields, quantity, sort_order, is_conditional, condition_field")
    .eq("product_type", productType)
    .is("series_id", null)
    .order("sort_order");

  return (data as LabelTemplate[]) || [];
}

async function fetchLabelSettings(): Promise<LabelSettings> {
  const { data } = await supabase
    .from("label_settings")
    .select("*")
    .limit(1)
    .single();

  if (!data) {
    return {
      leftZoneWidth: 16,
      leftZoneFields: ["series.code", "series.name", "series.collection"],
      headerTemplate: "{TYPE} | Zam: {ORDER}",
      seriesCodeSize: 18,
      seriesNameSize: 9,
      seriesCollectionSize: 7,
      contentMaxSize: 14,
      contentMinSize: 7,
      headerFontSize: 6,
    };
  }

    return {
    leftZoneWidth: Number(data.left_zone_width) || 16,
    leftZoneFields: (data.left_zone_fields as string[]) || ["series.code", "series.name", "series.collection"],
    headerTemplate: data.header_template || "{TYPE} | {LABEL} | {ORDER}",
    seriesCodeSize: Number(data.series_code_size) || 18,
    seriesNameSize: Number(data.series_name_size) || 9,
    seriesCollectionSize: Number(data.series_collection_size) || 7,
    contentMaxSize: Number(data.content_max_size) || 14,
    contentMinSize: Number(data.content_min_size) || 7,
  };
}

function shouldShow(decoded: DecodedSKU, tpl: LabelTemplate): boolean {
  if (!tpl.is_conditional || !tpl.condition_field) return true;
  return checkDecodedCondition(decoded, tpl.condition_field);
}

/** Normalize display_fields: flat string[] → string[][], nested stays as-is */
function normalizeDisplayFields(fields: unknown): string[][] {
  if (!Array.isArray(fields) || fields.length === 0) return [[]];
  if (typeof fields[0] === "string") return [fields as string[]];
  return fields as string[][];
}

function buildLabelLines(
  decoded: DecodedSKU,
  tpl: LabelTemplate,
  productType: string,
  settings: LabelSettings
): string[] {
  const s = seriesLine(decoded, settings.leftZoneFields, productType);
  const header = settings.headerTemplate
    .replace("{TYPE}", productType.toUpperCase())
    .replace("{LABEL}", tpl.label_name)
    .replace("{ORDER}", decoded.orderNumber || "");

  const lineGroups = normalizeDisplayFields(tpl.display_fields);
  const contentLines: string[] = [];

  for (let i = 0; i < lineGroups.length; i++) {
    const parts = lineGroups[i]
      .map((f) => {
        const val = resolveDecodedField(f, decoded);
        if (val === "-") return null;
        return formatFieldWithLabel(f, val);
      })
      .filter(Boolean) as string[];
    if (parts.length > 0) {
      contentLines.push(parts.join(" | "));
    }
  }

  if (contentLines.length === 0) {
    contentLines.push(tpl.label_name);
  }

  return [s, header, ...contentLines];
}

export async function generateLabelsPDF(
  decoded: DecodedSKU,
  productType: "sofa" | "pufa" | "fotel"
): Promise<Blob> {
  const [templates, settings] = await Promise.all([
    fetchTemplates(productType, decoded.series.code),
    fetchLabelSettings(),
  ]);

  const doc = await createDoc("landscape", [100, 30]);

  let isFirst = true;
  for (const tpl of templates) {
    if (!shouldShow(decoded, tpl)) continue;
    const lines = buildLabelLines(decoded, tpl, productType, settings);
    for (let i = 0; i < tpl.quantity; i++) {
      addLabel(doc, lines, isFirst, settings);
      isFirst = false;
    }
  }

  // Fallback if no templates found
  if (isFirst) {
    const fallbackSeries = seriesLine(decoded, settings.leftZoneFields, productType);
    const fallbackHeader = settings.headerTemplate
      .replace("{TYPE}", productType.toUpperCase())
      .replace("{LABEL}", "")
      .replace("{ORDER}", decoded.orderNumber || "")
      .replace("| |", "|");
    addLabel(doc, [fallbackSeries, fallbackHeader, "Brak szablonów etykiet"], true, settings);
  }

  return toBlob(doc);
}

// Legacy wrappers for backward compatibility
export async function generateSofaLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  return generateLabelsPDF(decoded, "sofa");
}

export async function generatePufaLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  return generateLabelsPDF(decoded, "pufa");
}

export async function generateFotelLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  return generateLabelsPDF(decoded, "fotel");
}
