import { DecodedSKU } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { createDoc, addHeader, addTable, toBlob } from "@/utils/pdfHelpers";
import { formatFoamsSummary } from "@/utils/foamHelpers";

interface GuideColumn {
  header: string;
  field: string;
}

interface GuideSection {
  id: string;
  product_type: string;
  series_id: string | null;
  section_name: string;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
  columns: GuideColumn[];
  enabled: boolean;
}

/**
 * Resolve a field path to a value from DecodedSKU.
 * Supports special computed fields like "seat.code_finish", "seat.foams_summary", etc.
 */
function resolveField(decoded: DecodedSKU, field: string): string {
  // Special computed fields
  switch (field) {
    case "seat.code":
      return decoded.seat.code;
    case "seat.finish_name":
      return decoded.seat.finishName;
    case "seat.code_finish":
      return `${decoded.seat.code} (${decoded.seat.finishName})`;
    case "seat.type":
      return decoded.seat.type || "-";
    case "seat.foams_summary":
      return formatFoamsSummary(decoded.seat.foams);
    case "seat.midStrip_yn":
      return decoded.seat.midStrip ? "TAK" : "NIE";
    case "seat.frameModification":
      return decoded.seat.frameModification || "-";
    case "backrest.code":
      return decoded.backrest.code;
    case "backrest.finish_name":
      return decoded.backrest.finishName;
    case "backrest.code_finish":
      return `${decoded.backrest.code}${decoded.backrest.finish} (${decoded.backrest.finishName})`;
    case "backrest.foams_summary":
      return formatFoamsSummary(decoded.backrest.foams);
    case "side.code":
      return decoded.side.code;
    case "side.finish_name":
      return decoded.side.finishName;
    case "side.code_finish":
      return `${decoded.side.code}${decoded.side.finish} (${decoded.side.finishName})`;
    case "side.foam":
      return "-";
    case "chest_automat.label":
      return `${decoded.chest.code} + ${decoded.automat.code}`;
    case "automat.code_name":
      return `${decoded.automat.code} - ${decoded.automat.name}`;
    case "legs.code_color":
      return decoded.legs ? `${decoded.legs.code}${decoded.legs.color || ""}` : "-";
    case "legHeights.sofa_chest_info": {
      const cl = decoded.legHeights.sofa_chest;
      return cl ? `${cl.leg} H ${cl.height}cm (${cl.count} szt)` : "-";
    }
    case "legHeights.sofa_seat_info": {
      const sl = decoded.legHeights.sofa_seat;
      return sl ? `${sl.leg} H ${sl.height}cm (${sl.count} szt)` : "BRAK";
    }
    case "pillow.finish_info":
      return decoded.pillow ? `${decoded.pillow.finish} (${decoded.pillow.finishName})` : "-";
    case "jaski.finish_info":
      return decoded.jaski ? `${decoded.jaski.finish} (${decoded.jaski.finishName})` : "-";
    case "walek.finish_info":
      return decoded.walek ? `${decoded.walek.finish} (${decoded.walek.finishName})` : "-";
    case "pufaLegs.count_info":
      return decoded.pufaLegs ? `${decoded.pufaLegs.count} szt` : "-";
    case "pufaLegs.height_info":
      return decoded.pufaLegs ? `H ${decoded.pufaLegs.height}cm` : "-";
    case "fotelLegs.count_info":
      return decoded.fotelLegs ? `${decoded.fotelLegs.count} szt` : "-";
    case "fotelLegs.height_info":
      return decoded.fotelLegs ? `H ${decoded.fotelLegs.height}cm` : "-";
    case "extras.label":
      return "";
    case "extras.pufa_sku":
      return decoded.pufaSKU || "-";
    case "extras.fotel_sku":
      return decoded.fotelSKU || "-";
    default:
      break;
  }

  // Generic dot-path resolution: "object.property"
  const parts = field.split(".");
  let val: any = decoded;
  for (const p of parts) {
    if (val == null) return "-";
    val = val[p];
  }
  if (val == null || val === "") return "-";
  if (typeof val === "boolean") return val ? "TAK" : "NIE";
  return String(val);
}

/**
 * Check if the condition field is truthy in decoded data.
 */
function checkCondition(decoded: DecodedSKU, conditionField: string): boolean {
  if (conditionField === "extras_pufa_fotel") {
    const hasPufa = decoded.extras.some(e => e.type === "pufa");
    const hasFotel = decoded.extras.some(e => e.type === "fotel");
    return hasPufa || hasFotel;
  }
  const parts = conditionField.split(".");
  let val: any = decoded;
  for (const p of parts) {
    if (val == null) return false;
    val = val[p];
  }
  return val != null && val !== false && val !== "";
}

/**
 * Fetch guide sections with series override logic.
 */
async function fetchSections(productType: string, seriesCode: string): Promise<GuideSection[]> {
  // Get series_id from code
  const { data: seriesData } = await supabase
    .from("series")
    .select("id")
    .eq("code", seriesCode)
    .maybeSingle();

  const seriesId = seriesData?.id;

  const { data, error } = await supabase
    .from("guide_sections")
    .select("*")
    .eq("product_type", productType)
    .eq("enabled", true)
    .order("sort_order");

  if (error || !data) return [];

  const sections = data as unknown as GuideSection[];

  // Override logic: if series-specific exists for a section_name, use it over global
  const result: GuideSection[] = [];
  const byName = new Map<string, GuideSection[]>();

  for (const s of sections) {
    const key = s.section_name;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(s);
  }

  for (const [, group] of byName) {
    const seriesSpecific = seriesId ? group.find(s => s.series_id === seriesId) : null;
    const global = group.find(s => s.series_id === null);
    result.push(seriesSpecific || global || group[0]);
  }

  result.sort((a, b) => a.sort_order - b.sort_order);
  return result;
}

/**
 * Fetch guide settings from DB (singleton).
 */
async function fetchGuideSettings() {
  const { data } = await supabase
    .from("guide_settings")
    .select("*")
    .limit(1)
    .single();
  return data ? {
    font_size_header: Number(data.font_size_header) || 11,
    font_size_table: Number(data.font_size_table) || 9,
    table_row_height: Number(data.table_row_height) || 8,
  } : { font_size_header: 11, font_size_table: 9, table_row_height: 8 };
}

/**
 * Universal PDF guide generator — replaces sofaGuide, pufaGuide, fotelGuide.
 */
export async function generateGuidePDF(
  decoded: DecodedSKU,
  productType: "sofa" | "pufa" | "fotel"
): Promise<Blob> {
  const [doc, guideSettings] = await Promise.all([
    createDoc("portrait", "a4"),
    fetchGuideSettings(),
  ]);
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  const prefixMap: Record<string, string | undefined> = {
    sofa: undefined,
    pufa: "PUFA",
    fotel: "FOTEL",
  };

  let y = addHeader(doc, orderNumber, seriesInfo, date, prefixMap[productType]);

  // SKU line
  const skuMap: Record<string, string> = {
    sofa: decoded.rawSKU || "",
    pufa: decoded.pufaSKU || "",
    fotel: decoded.fotelSKU || "",
  };
  doc.setFontSize(guideSettings.font_size_table);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`SKU: ${skuMap[productType]}`, 15, y);
  y += 7;

  // Fetch sections from DB
  const sections = await fetchSections(productType, decoded.series.code);

  const SEAT_FOAM_FIELDS = new Set(["seat.foams_summary", "seat.front", "seat.midStrip_yn"]);

  const renderColumns = (colsToRender: GuideColumn[], spacing: number) => {
    const MAX_COLS = 4;
    if (colsToRender.length <= MAX_COLS) {
      const headers = colsToRender.map(c => c.header);
      const row = colsToRender.map(c => resolveField(decoded, c.field));
      y = addTable(doc, y, headers, [row], undefined, spacing, guideSettings.font_size_table, guideSettings.table_row_height);
    } else {
      for (let i = 0; i < colsToRender.length; i += MAX_COLS) {
        const chunk = colsToRender.slice(i, i + MAX_COLS);
        const headers = chunk.map(c => c.header);
        const row = chunk.map(c => resolveField(decoded, c.field));
        const isLastChunk = i + MAX_COLS >= colsToRender.length;
        y = addTable(doc, y, headers, [row], undefined, isLastChunk ? spacing : 2, guideSettings.font_size_table, guideSettings.table_row_height);
      }
    }
  };

  for (const section of sections) {
    if (section.is_conditional && section.condition_field) {
      if (!checkCondition(decoded, section.condition_field)) continue;
    }

    const cols = section.columns as GuideColumn[];
    const frameCols = cols.filter(c => c.field.startsWith("seat.") && !SEAT_FOAM_FIELDS.has(c.field));
    const foamCols = cols.filter(c => SEAT_FOAM_FIELDS.has(c.field));
    const hasSplit = frameCols.length > 0 && foamCols.length > 0;

    if (hasSplit) {
      // Subgroup label: Stolarka
      doc.setFontSize(guideSettings.font_size_table);
      doc.setFont("Roboto", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Stolarka", 15, y);
      y += 3;
      renderColumns(frameCols, 4);

      // Subgroup label: Pianki
      doc.setFont("Roboto", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Pianki", 15, y);
      y += 3;
      renderColumns(foamCols, 8);
    } else {
      renderColumns(cols, 8);
    }
  }

  return toBlob(doc);
}
