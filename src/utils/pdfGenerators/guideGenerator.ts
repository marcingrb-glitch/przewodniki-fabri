import { DecodedSKU } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { createDoc, addHeader, addTable, toBlob } from "@/utils/pdfHelpers";
import { resolveDecodedField, checkDecodedCondition } from "./decodingFieldResolver";

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
 * Fetch guide sections with series override logic.
 */
async function fetchSections(productType: string, seriesCode: string): Promise<GuideSection[]> {
  // Get series_id from code
  const { data: seriesData } = await supabase
    .from("products")
    .select("id")
    .eq("category", "series")
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
      const row = colsToRender.map(c => resolveDecodedField(c.field, decoded));
      y = addTable(doc, y, headers, [row], undefined, spacing, guideSettings.font_size_table, guideSettings.table_row_height);
    } else {
      for (let i = 0; i < colsToRender.length; i += MAX_COLS) {
        const chunk = colsToRender.slice(i, i + MAX_COLS);
        const headers = chunk.map(c => c.header);
        const row = chunk.map(c => resolveDecodedField(c.field, decoded));
        const isLastChunk = i + MAX_COLS >= colsToRender.length;
        y = addTable(doc, y, headers, [row], undefined, isLastChunk ? spacing : 2, guideSettings.font_size_table, guideSettings.table_row_height);
      }
    }
  };

  for (const section of sections) {
    // Check condition BEFORE rendering anything
    if (section.is_conditional && section.condition_field) {
      if (!checkDecodedCondition(decoded, section.condition_field)) continue;
    }

    const cols = section.columns as GuideColumn[];
    const frameCols = cols.filter(c => c.field.startsWith("seat.") && !SEAT_FOAM_FIELDS.has(c.field));
    const foamCols = cols.filter(c => SEAT_FOAM_FIELDS.has(c.field));
    const hasSplit = frameCols.length > 0 && foamCols.length > 0;

    if (hasSplit) {
      // Subgroup headers with section name
      doc.setFontSize(guideSettings.font_size_header);
      doc.setFont("Roboto", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${section.section_name.toUpperCase()} — STOLARKA`, 15, y);
      y += 5;
      renderColumns(frameCols, 4);

      doc.setFontSize(guideSettings.font_size_header);
      doc.setFont("Roboto", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${section.section_name.toUpperCase()} — PIANKI`, 15, y);
      y += 5;
      renderColumns(foamCols, 8);
    } else {
      // Section name header
      doc.setFontSize(guideSettings.font_size_header);
      doc.setFont("Roboto", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(section.section_name.toUpperCase(), 15, y);
      y += 5;
      renderColumns(cols, 8);
    }
  }

  return toBlob(doc);
}
