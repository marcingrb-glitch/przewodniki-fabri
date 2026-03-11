import { DecodedSKU } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { createDoc, addHeader, addTableAt, toBlob } from "@/utils/pdfHelpers";
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

async function fetchDecodingSections(seriesCode: string): Promise<GuideSection[]> {
  const { data: seriesData } = await supabase
    .from("series")
    .select("id")
    .eq("code", seriesCode)
    .maybeSingle();

  const seriesId = seriesData?.id;

  const { data, error } = await supabase
    .from("guide_sections")
    .select("*")
    .eq("product_type", "decoding")
    .eq("enabled", true)
    .order("sort_order");

  if (error || !data) return [];

  const sections = data as unknown as GuideSection[];

  const byName = new Map<string, GuideSection[]>();
  for (const s of sections) {
    if (!byName.has(s.section_name)) byName.set(s.section_name, []);
    byName.get(s.section_name)!.push(s);
  }

  const result: GuideSection[] = [];
  for (const [, group] of byName) {
    const seriesSpecific = seriesId ? group.find(s => s.series_id === seriesId) : null;
    const global = group.find(s => s.series_id === null);
    result.push(seriesSpecific || global || group[0]);
  }

  result.sort((a, b) => a.sort_order - b.sort_order);
  return result;
}

/** A render item ready for column placement */
interface RenderItem {
  title: string;
  headers: string[];
  rows: string[][];
  fontSize: number;
  columnStyles?: { [key: string]: { cellWidth: number } };
}

/** Estimate the height of a column of render items in mm */
function estimateColumnHeight(items: RenderItem[], rh: number, sp: number): number {
  let h = 0;
  for (const item of items) {
    if (item.title) h += 3;
    const rowCount = 1 + item.rows.length;
    h += rowCount * (rh + item.fontSize * 0.15) + 2 * 2.5;
    h += sp;
  }
  return h;
}

export async function generateDecodingPDF(
  decoded: DecodedSKU,
  variantImageUrl?: string
): Promise<Blob> {
  const [doc, sections] = await Promise.all([
    createDoc("portrait", "a4"),
    fetchDecodingSections(decoded.series.code),
  ]);

  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date);

  // SKU
  doc.setFontSize(13);
  doc.setFont("Roboto", "bold");
  doc.text(`SKU: ${decoded.rawSKU || ""}`, 105, y, { align: "center" });
  y += 8;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);
  y += 3;

  // --- Table parameters ---
  const fs = 10;
  const rh = 8;
  const sp = 3;
  const MAX_COLS = 6;
  const SEAT_FOAM_FIELDS = new Set(["seat.foams_summary", "seat.front", "seat.midStrip_yn"]);

  // --- Build render items from sections BEFORE drawing image ---
  const groups: { sections: GuideSection[] }[] = [];
  for (const section of sections) {
    if (section.is_conditional && section.condition_field) {
      if (!checkDecodedCondition(decoded, section.condition_field)) continue;
    }
    const headersKey = section.columns.map(c => c.header).join("|");
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && section.is_conditional) {
      const lastHeaders = lastGroup.sections[0].columns.map(c => c.header).join("|");
      if (headersKey === lastHeaders && lastGroup.sections[0].is_conditional) {
        lastGroup.sections.push(section);
        continue;
      }
    }
    groups.push({ sections: [section] });
  }

  const renderItems: RenderItem[] = [];

  const adaptiveFontSize = (colCount: number): number =>
    colCount <= 3 ? 10 : colCount === 4 ? 9 : 8;

  const buildChunkedItems = (title: string, cols: GuideColumn[]): RenderItem[] => {
    const items: RenderItem[] = [];
    if (cols.length <= MAX_COLS) {
      items.push({
        title,
        headers: cols.map(c => c.header),
        rows: [cols.map(c => resolveDecodedField(c.field, decoded))],
        fontSize: adaptiveFontSize(cols.length),
      });
    } else {
      for (let i = 0; i < cols.length; i += MAX_COLS) {
        const chunk = cols.slice(i, i + MAX_COLS);
        items.push({
          title: i === 0 ? title : "",
          headers: chunk.map(c => c.header),
          rows: [chunk.map(c => resolveDecodedField(c.field, decoded))],
          fontSize: adaptiveFontSize(chunk.length),
        });
      }
    }
    return items;
  };

  for (const group of groups) {
    if (group.sections.length > 1) {
      const groupName = group.sections.map(s => s.section_name).join(" / ");
      const cols = group.sections[0].columns;
      const headers = ["Typ", ...cols.map(c => c.header)];
      const rows = group.sections.map(section => [
        section.section_name,
        ...cols.map(c => resolveDecodedField(c.field, decoded)),
      ]);
      renderItems.push({ title: groupName, headers, rows, fontSize: adaptiveFontSize(headers.length), columnStyles: { 0: { cellWidth: 20 } } });
    } else {
      const section = group.sections[0];
      const cols = section.columns;
      const frameCols = cols.filter(c => c.field.startsWith("seat.") && !SEAT_FOAM_FIELDS.has(c.field));
      const foamCols = cols.filter(c => SEAT_FOAM_FIELDS.has(c.field));
      const hasSplit = frameCols.length > 0 && foamCols.length > 0;

      if (hasSplit) {
        renderItems.push(...buildChunkedItems(`${section.section_name} — STOLARKA`, frameCols));
        renderItems.push(...buildChunkedItems(`${section.section_name} — PIANKI`, foamCols));
      } else {
        renderItems.push(...buildChunkedItems(section.section_name, cols));
      }
    }
  }

  // --- Calculate dynamic image height ---
  const midPoint = Math.ceil(renderItems.length / 2);
  const leftItems = renderItems.slice(0, midPoint);
  const rightItems = renderItems.slice(midPoint);

  const leftH = estimateColumnHeight(leftItems, rh, sp);
  const rightH = estimateColumnHeight(rightItems, rh, sp);
  const maxColH = Math.max(leftH, rightH);

  const pageH = 297;
  const bottomMargin = 10;
  const imageGap = 4;
  const availableForImage = pageH - bottomMargin - y - imageGap - maxColH;
  const imageH = Math.max(20, Math.min(80, availableForImage));

  // --- Draw variant image ---
  const imageX = 15;
  const imageW = 180;

  if (variantImageUrl) {
    try {
      const response = await fetch(variantImageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = base64;
      });

      doc.setFillColor(245, 245, 245);
      doc.rect(imageX, y, imageW, imageH, "F");

      const imgRatio = dims.w / dims.h;
      const areaRatio = imageW / imageH;
      let drawW: number, drawH: number, drawX: number, drawY: number;

      if (imgRatio > areaRatio) {
        drawW = imageW;
        drawH = imageW / imgRatio;
        drawX = imageX;
        drawY = y + (imageH - drawH) / 2;
      } else {
        drawH = imageH;
        drawW = imageH * imgRatio;
        drawX = imageX + (imageW - drawW) / 2;
        drawY = y;
      }

      doc.addImage(base64, "JPEG", drawX, drawY, drawW, drawH);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(imageX, y, imageW, imageH);
    } catch (error) {
      console.error("Error adding image to PDF:", error);
      drawPlaceholder(doc, imageX, y, imageW, imageH);
    }
  } else {
    drawPlaceholder(doc, imageX, y, imageW, imageH);
  }

  y += imageH + imageGap;

  // --- Two-column rendering ---
  const colLeftX = 15;
  const colRightX = 105;
  const colW = 85;
  const startY = y;

  const renderColumn = (items: RenderItem[], xStart: number, yStart: number): number => {
    let cy = yStart;
    for (const item of items) {
      if (item.title) {
        doc.setFontSize(7);
        doc.setFont("Roboto", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(item.title.toUpperCase(), xStart, cy);
        cy += 3;
      }
      cy = addTableAt(doc, cy, item.headers, item.rows, xStart, colW, item.columnStyles, sp, fs, rh);
    }
    return cy;
  };

  const yLeft = renderColumn(leftItems, colLeftX, startY);
  const yRight = renderColumn(rightItems, colRightX, startY);
  y = Math.max(yLeft, yRight);

  return toBlob(doc);
}

function drawPlaceholder(doc: any, x: number, y: number, w: number, h: number) {
  doc.setFillColor(245, 245, 245);
  doc.rect(x, y, w, h, "F");
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h);
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont("Roboto", "normal");
  doc.text("Brak zdjęcia", x + w / 2, y + h / 2, { align: "center" });
  doc.setTextColor(0, 0, 0);
}
