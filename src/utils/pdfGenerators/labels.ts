import { DecodedSKU } from "@/types";
import { createDoc, addLabel, toBlob } from "@/utils/pdfHelpers";
import { supabase } from "@/integrations/supabase/client";
import { formatFoamsDetailed } from "@/utils/foamHelpers";

function seriesLine(decoded: DecodedSKU): string {
  return `${decoded.series.code}|${decoded.series.name}|${decoded.series.collection}`;
}

/** Resolve a dotted path like "seat.code" from DecodedSKU */
function resolveField(decoded: DecodedSKU, path: string): string {
  // Special handling for foams lists
  if (path === "seat.foamsList") {
    const lines = formatFoamsDetailed(decoded.seat.foams);
    return lines.length > 0 ? lines.join("\n") : "-";
  }
  if (path === "backrest.foamsList") {
    const lines = formatFoamsDetailed(decoded.backrest.foams);
    return lines.length > 0 ? lines.join("\n") : "-";
  }

  // Legacy leg.* aliases → map to legHeights.sofa_chest.*
  const legAliases: Record<string, string> = {
    "leg.code": "legHeights.sofa_chest.leg",
    "leg.height": "legHeights.sofa_chest.height",
    "leg.count": "legHeights.sofa_chest.count",
  };
  const resolvedPath = legAliases[path] || path;

  const parts = resolvedPath.split(".");
  let current: unknown = decoded;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return "-";
    current = (current as Record<string, unknown>)[part];
  }
  if (current == null) return "-";
  if (typeof current === "boolean") return current ? "Tak" : "Nie";
  return String(current);
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
      .from("series")
      .select("id")
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

function shouldShow(decoded: DecodedSKU, tpl: LabelTemplate): boolean {
  if (!tpl.is_conditional || !tpl.condition_field) return true;
  const val = resolveField(decoded, tpl.condition_field);
  return val !== "-" && val !== "" && val !== "null" && val !== "undefined";
}

function buildLabelLines(decoded: DecodedSKU, tpl: LabelTemplate, productType: string): string[] {
  const s = seriesLine(decoded);
  const typeLabel = productType.toUpperCase();
  const header = `${typeLabel} | Zam: ${decoded.orderNumber || ""}`;

  const fields = (tpl.display_fields || [])
    .map((f) => resolveField(decoded, f))
    .filter((v) => v !== "-");

  const fieldLine = fields.length > 0 ? `${tpl.label_name}: ${fields.join(" ")}` : tpl.label_name;

  return [s, header, fieldLine];
}

export async function generateLabelsPDF(
  decoded: DecodedSKU,
  productType: "sofa" | "pufa" | "fotel"
): Promise<Blob> {
  const templates = await fetchTemplates(productType, decoded.series.code);
  const doc = await createDoc("landscape", [100, 30]);

  let isFirst = true;
  for (const tpl of templates) {
    if (!shouldShow(decoded, tpl)) continue;
    const lines = buildLabelLines(decoded, tpl, productType);
    for (let i = 0; i < tpl.quantity; i++) {
      addLabel(doc, lines, isFirst);
      isFirst = false;
    }
  }

  // Fallback if no templates found — generate at least one empty label
  if (isFirst) {
    addLabel(doc, [seriesLine(decoded), `${productType.toUpperCase()} | Zam: ${decoded.orderNumber || ""}`, "Brak szablonów etykiet"], true);
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
