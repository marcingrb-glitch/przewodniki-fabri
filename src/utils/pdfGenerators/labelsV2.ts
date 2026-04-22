/**
 * Etykiety V2 — duże 100×150mm portrait z pełnym briefem dla tapicera.
 * Szablony w tabeli `label_templates_v2` z sekcjami JSONB (plain/bullet_list/table/diagram_box).
 *
 * Patrz plan: .claude/plans/mossy-riding-bear.md
 */
import jsPDF from "jspdf";
import { DecodedSKU } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { createDoc, addLabel, toBlob } from "@/utils/pdfHelpers";
import { resolveDecodedField, checkDecodedCondition } from "./decodingFieldResolver";
import { formatFieldWithLabel } from "@/utils/fieldLabels";
import {
  fetchTemplates,
  fetchLabelSettings,
  shouldShow,
  buildLabelLines,
} from "./labels";

// ─── Page geometry (mm) ──────────────────────────────────────────────────
const PAGE_W = 100;
const PAGE_H = 150;
const MARGIN_X = 5;
const MARGIN_TOP = 5;
const MARGIN_BOTTOM = 5;
const CONTENT_W = PAGE_W - 2 * MARGIN_X;

// Font sizes — AUTO-FIT: każda linia skaluje się od MAX do MIN
const HEADER_FONT_MAX = 22;   // header_template LEFT — "SOFA Viena [S1]"
const HEADER_FONT_MIN = 9;    // shrink niżej jeśli template długi (np. pufa)
const ORDER_NUMBER_FONT = 32; // duży # zamówienia — prawy górny róg każdego arkusza
const META_FONT = 11;
const SECTION_GAP = 5; // odstęp między sekcjami (dynamicznie może się zwiększyć)

// Auto-fit: bazowe i twarde krańce
const TITLE_DEFAULT_MAX = 16;
const TITLE_HARD_CAP = 24; // max przy scale up (tytuły mniej prominent niż poprzednio)
const TITLE_MIN = 11;
const BODY_DEFAULT_MAX = 16;
const BODY_HARD_CAP = 26; // max przy scale up
const BODY_MIN = 10;
const LINE_HEIGHT_RATIO = 0.6; // line height = fontSize × ratio

// Dynamiczne maxy (ustawiane per arkusz w renderSheet, żeby maksymalnie wypełnić wysokość)
let CURRENT_TITLE_MAX = TITLE_DEFAULT_MAX;
let CURRENT_BODY_MAX = BODY_DEFAULT_MAX;
let CURRENT_SECTION_GAP = SECTION_GAP;
// Header template aktualnego arkusza — używany przez legs_list do re-print na cut-off
let CURRENT_HEADER_TEMPLATE: string | null = null;

// Kompat dla starych callerów
const SECTION_TITLE_FONT = TITLE_MIN;
const BODY_FONT = BODY_MIN;
const LINE_H = BODY_MIN * LINE_HEIGHT_RATIO;

/**
 * Auto-fit rozmiar fontu dla tekstu: zaczyna od max i zmniejsza o 0.5pt aż zmieści się w maxWidth.
 */
function fitFontSize(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  opts: { max: number; min: number; bold?: boolean } = { max: CURRENT_BODY_MAX, min: BODY_MIN }
): number {
  doc.setFont("Roboto", opts.bold ? "bold" : "normal");
  let size = opts.max;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidth && size > opts.min) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

// ─── Section shapes (from JSONB) ─────────────────────────────────────────
export type SectionStyle = "plain" | "bullet_list" | "table" | "diagram_box" | "legs_list";

export interface Section {
  title?: string;
  component: string;
  style: SectionStyle;
  display_fields?: string[][];
  fields?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    center?: string;
  };
  box_size_mm?: number;
  condition_field?: string;
}

export interface LabelTemplateV2 {
  id: string;
  product_type: string;
  series_id: string | null;
  sheet_name: string;
  sort_order: number;
  is_conditional: boolean;
  condition_field: string | null;
  header_template: string | null;
  show_meta_row: boolean;
  include_in_v3: boolean;
  sections: Section[];
}

// ─── Page geometry export (for V3 generator) ────────────────────────────
export const V2_PAGE = { width: PAGE_W, height: PAGE_H };

// ─── Fetch ───────────────────────────────────────────────────────────────
export async function fetchSheets(
  productType: string,
  seriesCode?: string
): Promise<LabelTemplateV2[]> {
  let seriesId: string | null = null;
  if (seriesCode) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("category", "series")
      .eq("code", seriesCode)
      .maybeSingle();
    seriesId = data?.id ?? null;
  }

  // Series-specific first, then fall back to global (series_id IS NULL)
  const results: LabelTemplateV2[] = [];

  if (seriesId) {
    const { data } = await supabase
      .from("label_templates_v2")
      .select("*")
      .eq("product_type", productType)
      .eq("series_id", seriesId)
      .order("sort_order");
    if (data && data.length > 0) {
      results.push(...(data as unknown as LabelTemplateV2[]));
    }
  }

  // Also add global templates (series_id IS NULL) for the same product_type
  const { data: globalData } = await supabase
    .from("label_templates_v2")
    .select("*")
    .eq("product_type", productType)
    .is("series_id", null)
    .order("sort_order");
  if (globalData && globalData.length > 0) {
    results.push(...(globalData as unknown as LabelTemplateV2[]));
  }

  // Pufa = single source of truth. For sofa/naroznik, pull the canonical pufa
  // sheet (product_type='pufa', series_id=NULL) and attach it as a conditional
  // sheet (only printed when the order contains a pufa — extras_pufa_fotel).
  if (productType === "sofa" || productType === "naroznik") {
    const { data: pufaData } = await supabase
      .from("label_templates_v2")
      .select("*")
      .eq("product_type", "pufa")
      .is("series_id", null)
      .order("sort_order");
    if (pufaData && pufaData.length > 0) {
      for (const p of pufaData as unknown as LabelTemplateV2[]) {
        results.push({
          ...p,
          is_conditional: true,
          condition_field: "extras_pufa_fotel",
          sort_order: 99,
        });
      }
    }
  }

  return results;
}

// ─── Header/meta rendering ───────────────────────────────────────────────
function renderHeader(
  doc: jsPDF,
  sheet: LabelTemplateV2,
  decoded: DecodedSKU,
  y: number,
  continued = false
): number {
  // Jeden wiersz: LEFT = rozwinięty header_template ("SOFA Viena [S1]"),
  // RIGHT = duży #orderNumber. Oba dzielą się szerokością.
  const template = sheet.header_template || "{sheet_name}        {series.code} · {series.name}";
  let rendered = template
    .replace("{sheet_name}", sheet.sheet_name)
    .replace("{series.code}", decoded.series.code || "")
    .replace("{series.name}", decoded.series.name || "")
    .replace("{series.collection}", decoded.series.collection || "")
    .replace("{orientation}", decoded.orientation === "L" ? "L" : decoded.orientation === "P" ? "P" : "");
  if (continued) rendered += " (cd.)";

  // RIGHT: order# — max ~55% szerokości
  let orderSize = ORDER_NUMBER_FONT;
  let orderWidth = 0;
  if (decoded.orderNumber) {
    doc.setFont("Roboto", "bold");
    doc.setFontSize(orderSize);
    const text = `${decoded.orderNumber}`;
    const maxWidth = CONTENT_W * 0.55;
    while (doc.getTextWidth(text) > maxWidth && orderSize > 15) {
      orderSize -= 1;
      doc.setFontSize(orderSize);
    }
    orderWidth = doc.getTextWidth(text);
    doc.setTextColor(0, 0, 0);
    doc.text(text, PAGE_W - MARGIN_X, y + orderSize * 0.32, {
      align: "right",
      baseline: "alphabetic",
    });
  }

  // LEFT: header_template w pozostałej szerokości, auto-fit
  const availableLeft = CONTENT_W - orderWidth - 3;
  const headerSize = fitFontSize(doc, rendered, availableLeft, {
    max: HEADER_FONT_MAX,
    min: HEADER_FONT_MIN,
    bold: true,
  });
  doc.setFont("Roboto", "bold");
  doc.setFontSize(headerSize);
  doc.setTextColor(0, 0, 0);
  doc.text(rendered, MARGIN_X, y + orderSize * 0.32, { baseline: "alphabetic" });

  return y + orderSize * 0.45 + 1;
}

function renderMetaRow(doc: jsPDF, decoded: DecodedSKU, y: number): number {
  // # zamówienia jest już w renderHeader (duży, prawy róg). Tu tylko szerokość.
  const widthPart = decoded.width ? `${decoded.width} cm` : "";
  if (!widthPart) return y;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(META_FONT);
  doc.text(widthPart, MARGIN_X, y + META_FONT * 0.35, { baseline: "alphabetic" });

  // Wyraźny separator pod meta row (jak między sekcjami)
  const divY = y + META_FONT * 0.55 + 1;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, divY, PAGE_W - MARGIN_X, divY);

  return divY + 2;
}

// ─── Section renderers ───────────────────────────────────────────────────
function interpolateTitle(title: string, decoded: DecodedSKU): string {
  if (!title || !title.includes("{")) return title;
  return title.replace(/\{([^}]+)\}/g, (_, key) => {
    // Zmienne z sufiksem jednostki
    if (key === "width") return decoded.width ? `${decoded.width} cm` : "";
    if (key === "backrest.height") {
      const h = decoded.backrest?.height;
      if (!h) return "";
      // Jeśli już zawiera "cm" to nie dublujemy
      return /cm/i.test(h) ? h : `${h} cm`;
    }
    // Predefiniowane (kompat)
    if (key === "series.code") return decoded.series.code || "";
    if (key === "series.name") return decoded.series.name || "";
    if (key === "series.collection") return decoded.series.collection || "";
    if (key === "orientation") return decoded.orientation === "L" ? "L" : decoded.orientation === "P" ? "P" : "";
    // Fallback — każde inne pole rozwiązywane przez resolver
    try {
      const val = resolveDecodedField(key, decoded);
      return val && val !== "-" ? val : "";
    } catch {
      return "";
    }
  }).replace(/\s+/g, " ").trim();
}

function renderSectionTitle(doc: jsPDF, title: string, decoded: DecodedSKU, y: number): number {
  const rendered = interpolateTitle(title, decoded);
  const text = `▸ ${rendered}`;
  const size = fitFontSize(doc, text, CONTENT_W, { max: CURRENT_TITLE_MAX, min: TITLE_MIN, bold: true });
  doc.setFont("Roboto", "bold");
  doc.setFontSize(size);
  doc.text(text, MARGIN_X, y + size * 0.35, { baseline: "alphabetic" });
  return y + size * LINE_HEIGHT_RATIO + 1;
}

function renderPlain(doc: jsPDF, section: Section, decoded: DecodedSKU, y: number): number {
  let cursorY = y;
  if (section.title) cursorY = renderSectionTitle(doc, section.title, decoded, cursorY);

  const rows = section.display_fields ?? [];
  // Zbierz wszystkie linie, policz min rozmiar — wszystkie linie w sekcji dostają wspólny font
  const lines: string[] = [];
  for (const row of rows) {
    const parts = row
      .map((f) => {
        const val = resolveDecodedField(f, decoded);
        if (val === "-" || val === "") return null;
        return formatFieldWithLabel(f, val);
      })
      .filter(Boolean) as string[];
    if (parts.length === 0) continue;
    lines.push(`  ${parts.join("  ")}`);
  }

  if (lines.length === 0) return cursorY + 1;

  let size = CURRENT_BODY_MAX;
  for (const line of lines) {
    size = Math.min(size, fitFontSize(doc, line, CONTENT_W, { max: CURRENT_BODY_MAX, min: BODY_MIN }));
  }

  doc.setFont("Roboto", "normal");
  doc.setFontSize(size);
  const lineH = size * LINE_HEIGHT_RATIO;
  for (const line of lines) {
    doc.text(line, MARGIN_X, cursorY + lineH * 0.75);
    cursorY += lineH;
  }
  return cursorY + 1;
}

function renderBulletList(doc: jsPDF, section: Section, decoded: DecodedSKU, y: number): number {
  let cursorY = y;
  if (section.title) cursorY = renderSectionTitle(doc, section.title, decoded, cursorY);

  // Each field can return multi-line content (e.g. foams — już z labelami w każdej linii).
  // Dla wartości 1-liniowych dodajemy prefix "Label: value" (np. "Środkowy pasek: TAK").
  const rows = section.display_fields ?? [];
  const bullets: string[] = [];
  for (const row of rows) {
    for (const f of row) {
      const val = resolveDecodedField(f, decoded);
      if (val === "-" || val === "") continue;
      const lines = val.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 1) {
        bullets.push(formatFieldWithLabel(f, lines[0]));
      } else {
        for (const line of lines) bullets.push(line);
      }
    }
  }

  if (bullets.length === 0) return cursorY + 1;

  // Wspólny rozmiar — najmniejszy wymagany przez jakikolwiek bullet
  let size = CURRENT_BODY_MAX;
  for (const b of bullets) {
    const line = `  • ${b}`;
    size = Math.min(size, fitFontSize(doc, line, CONTENT_W, { max: CURRENT_BODY_MAX, min: BODY_MIN }));
  }

  doc.setFont("Roboto", "normal");
  doc.setFontSize(size);
  const lineH = size * LINE_HEIGHT_RATIO;
  for (const b of bullets) {
    doc.text(`  • ${b}`, MARGIN_X, cursorY + lineH * 0.75);
    cursorY += lineH;
  }
  return cursorY + 1;
}

function renderTable(doc: jsPDF, section: Section, decoded: DecodedSKU, y: number): number {
  // Simple 2-column "label: value" table (reuse plain for MVP)
  return renderPlain(doc, section, decoded, y);
}

// Jeśli wartość wygląda jak wymiary "NxNxN" / "N x N x N" — wyciągnij pierwszy wymiar.
// Dla pufy etykieta pokazuje np. "17 x 63 x 1" a do produkcji trzeba tylko wysokość "17".
function firstDimIfDim(val: string): string {
  if (!val) return val;
  if (/\d+(\.\d+)?\s*[x×]\s*\d+/i.test(val)) {
    const m = val.match(/^\s*(\d+(?:\.\d+)?)/);
    if (m) return m[1];
  }
  return val;
}

// Wyciągnij najmniejszy wymiar — np. "17 x 63 x 1" → "1" (grubość półwałka).
function smallestDimIfDim(val: string): string {
  if (!val) return val;
  if (/\d+(\.\d+)?\s*[x×]\s*\d+/i.test(val)) {
    const nums = Array.from(val.matchAll(/(\d+(?:\.\d+)?)/g)).map((m) => parseFloat(m[1]));
    if (nums.length > 0) {
      const min = Math.min(...nums);
      return Number.isInteger(min) ? String(min) : min.toString();
    }
  }
  return val;
}

function renderDiagramBox(doc: jsPDF, section: Section, decoded: DecodedSKU, y: number): number {
  let cursorY = y;
  if (section.title) cursorY = renderSectionTitle(doc, section.title, decoded, cursorY);

  const boxSize = section.box_size_mm ?? 40; // default mniejszy (było 50)
  const boxX = MARGIN_X + (CONTENT_W - boxSize) / 2;
  const boxY = cursorY + 8; // margin for top label

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(boxX, boxY, boxSize, boxSize);

  const fields = section.fields ?? {};
  const topVal = fields.top ? resolveDecodedField(fields.top, decoded) : "";
  const bottomVal = fields.bottom ? resolveDecodedField(fields.bottom, decoded) : "";
  const leftRaw = fields.left ? resolveDecodedField(fields.left, decoded) : "";
  const rightRaw = fields.right ? resolveDecodedField(fields.right, decoded) : "";
  const centerRaw = fields.center ? resolveDecodedField(fields.center, decoded) : "";

  // Jeśli wartość ma wymiary "NxNxN" → pokaż tylko najmniejszy (grubość).
  // Jeśli tekst (np. "SD04", "Półwałek") → pokaż tak jak jest.
  const leftVal = smallestDimIfDim(leftRaw);
  const rightVal = smallestDimIfDim(rightRaw);
  const centerVal = smallestDimIfDim(centerRaw);

  // Labele (top/bottom — opisy) — większa czcionka niż standardowy body
  const LABEL_SIZE = 13;
  const DIM_SIZE = 18; // duże wymiary na bokach / wewnątrz

  const topBottomMaxW = CONTENT_W - 2;
  const sideMaxW = (CONTENT_W - boxSize) / 2 - 1;

  // Top
  if (topVal && topVal !== "-") {
    const sz = fitFontSize(doc, topVal, topBottomMaxW, { max: LABEL_SIZE, min: 8 });
    doc.setFont("Roboto", "normal");
    doc.setFontSize(sz);
    doc.text(topVal, boxX + boxSize / 2, boxY - 2, { align: "center" });
  }
  // Bottom
  if (bottomVal && bottomVal !== "-") {
    const sz = fitFontSize(doc, bottomVal, topBottomMaxW, { max: LABEL_SIZE, min: 8 });
    doc.setFont("Roboto", "normal");
    doc.setFontSize(sz);
    doc.text(bottomVal, boxX + boxSize / 2, boxY + boxSize + sz * 0.5, { align: "center" });
  }
  // Left
  if (leftVal && leftVal !== "-") {
    const sz = fitFontSize(doc, leftVal, sideMaxW, { max: DIM_SIZE, min: 8, bold: true });
    doc.setFont("Roboto", "bold");
    doc.setFontSize(sz);
    doc.text(leftVal, boxX - 2, boxY + boxSize / 2, { align: "right", baseline: "middle" });
  }
  // Right
  if (rightVal && rightVal !== "-") {
    const sz = fitFontSize(doc, rightVal, sideMaxW, { max: DIM_SIZE, min: 8, bold: true });
    doc.setFont("Roboto", "bold");
    doc.setFontSize(sz);
    doc.text(rightVal, boxX + boxSize + 2, boxY + boxSize / 2, { align: "left", baseline: "middle" });
  }
  // Center
  if (centerVal && centerVal !== "-") {
    const sz = fitFontSize(doc, centerVal, boxSize - 4, { max: DIM_SIZE + 4, min: 8, bold: true });
    doc.setFont("Roboto", "bold");
    doc.setFontSize(sz);
    doc.text(centerVal, boxX + boxSize / 2, boxY + boxSize / 2, { align: "center", baseline: "middle" });
  }

  return boxY + boxSize + LABEL_SIZE + 2;
}

// Legs list — komplet nóżek (siedzisko + skrzynia + pufa + fotel) z linią odcięcia
// przed sekcją. Po odcięciu pasek ma własny mini-header (template + order#) żeby
// było wiadomo do którego zamówienia należy.
function renderLegsList(doc: jsPDF, section: Section, decoded: DecodedSKU, y: number): number {
  // Prominent cut-line divider
  doc.setLineDashPattern([1.2, 1], 0);
  doc.setDrawColor(80);
  doc.setLineWidth(0.25);
  const guideY = y + 2;
  doc.line(MARGIN_X - 2, guideY, PAGE_W - MARGIN_X + 2, guideY);
  doc.setFontSize(6);
  doc.setTextColor(120);
  doc.text("\u2702", 1.5, guideY + 1.5);
  doc.setTextColor(0);
  doc.setLineDashPattern([], 0);

  let cursorY = y + 6;

  // Mini-header pod cut line — tylko numer zamówienia (bez template, bo nogi są
  // uniwersalne dla sofa/pufa/fotel). Pod spodem gruba kreska oddzielająca.
  const orderText = decoded.orderNumber ? `${decoded.orderNumber}` : "";
  let orderSize = ORDER_NUMBER_FONT;
  if (orderText) {
    doc.setFont("Roboto", "bold");
    doc.setFontSize(orderSize);
    while (doc.getTextWidth(orderText) > CONTENT_W - 1 && orderSize > 15) {
      orderSize -= 1;
      doc.setFontSize(orderSize);
    }
    doc.setTextColor(0, 0, 0);
    doc.text(orderText, PAGE_W - MARGIN_X, cursorY + orderSize * 0.32, {
      align: "right",
      baseline: "alphabetic",
    });
    cursorY += orderSize * 0.45 + 1;
  }
  // Gruba kreska pod numerem
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, cursorY, PAGE_W - MARGIN_X, cursorY);
  cursorY += 2;

  if (section.title) cursorY = renderSectionTitle(doc, section.title, decoded, cursorY);

  const lines: string[] = [];
  const legSeat = decoded.legHeights?.sofa_seat;
  if (legSeat) lines.push(`Siedzisko: ${legSeat.leg} · ${legSeat.height} cm · ${legSeat.count} szt.`);
  const legChest = decoded.legHeights?.sofa_chest;
  if (legChest) lines.push(`Skrzynia:  ${legChest.leg} · ${legChest.height} cm · ${legChest.count} szt.`);
  if (decoded.pufaLegs) {
    lines.push(`Pufa:      ${decoded.pufaLegs.code} · ${decoded.pufaLegs.height} cm · ${decoded.pufaLegs.count} szt.`);
  }
  if (decoded.fotelLegs) {
    lines.push(`Fotel:     ${decoded.fotelLegs.code} · ${decoded.fotelLegs.height} cm · ${decoded.fotelLegs.count} szt.`);
  }

  if (lines.length === 0) return cursorY + 1;

  let size = CURRENT_BODY_MAX;
  for (const line of lines) {
    const t = `  ${line}`;
    size = Math.min(size, fitFontSize(doc, t, CONTENT_W, { max: CURRENT_BODY_MAX, min: BODY_MIN }));
  }

  doc.setFont("Roboto", "normal");
  doc.setFontSize(size);
  const lineH = size * LINE_HEIGHT_RATIO;
  for (const line of lines) {
    doc.text(`  ${line}`, MARGIN_X, cursorY + lineH * 0.75);
    cursorY += lineH;
  }
  return cursorY + 1;
}

function renderSection(doc: jsPDF, section: Section, decoded: DecodedSKU, y: number): number {
  // Per-section condition: skip if false
  if (section.condition_field && !checkDecodedCondition(decoded, section.condition_field)) {
    return y;
  }

  // legs_list rysuje własną linię odcięcia — pomijamy standardowy separator
  if (section.style !== "legs_list") {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_X, y - 0.5, PAGE_W - MARGIN_X, y - 0.5);
  }

  switch (section.style) {
    case "plain":       return renderPlain(doc, section, decoded, y);
    case "bullet_list": return renderBulletList(doc, section, decoded, y);
    case "table":       return renderTable(doc, section, decoded, y);
    case "diagram_box": return renderDiagramBox(doc, section, decoded, y);
    case "legs_list":   return renderLegsList(doc, section, decoded, y);
    default:            return renderPlain(doc, section, decoded, y);
  }
}

export function shouldShowSheet(decoded: DecodedSKU, sheet: LabelTemplateV2): boolean {
  if (!sheet.is_conditional || !sheet.condition_field) return true;
  return checkDecodedCondition(decoded, sheet.condition_field);
}

// ─── Pre-measure section height (for page-break decisions) ───────────────
// Mirrors the renderers but only measures. `splitTextToSize` is a pure
// layout call and doesn't draw. Returns height in mm the section will need.
function measureSection(doc: jsPDF, section: Section, decoded: DecodedSKU): number {
  if (section.condition_field && !checkDecodedCondition(decoded, section.condition_field)) {
    return 0;
  }

  // Worst-case measure: przyjmujemy że każda linia renderuje się przy max rozmiarze
  // (auto-fit może zmniejszyć, więc realna wysokość ≤ oszacowanej → bezpieczne).
  const TITLE_H = CURRENT_TITLE_MAX * LINE_HEIGHT_RATIO + 1;
  const BODY_LINE_H = CURRENT_BODY_MAX * LINE_HEIGHT_RATIO;
  let h = section.title ? TITLE_H : 0;

  if (section.style === "diagram_box") {
    const boxSize = section.box_size_mm ?? 50;
    return h + 6 + boxSize + 10;
  }

  if (section.style === "legs_list") {
    let n = 0;
    if (decoded.legHeights?.sofa_seat) n++;
    if (decoded.legHeights?.sofa_chest) n++;
    if (decoded.pufaLegs) n++;
    if (decoded.fotelLegs) n++;
    // 6mm cut-line + ~16mm mini-header (order# + template — duży jak main) + title + N lines + tail
    return 6 + 16 + h + n * BODY_LINE_H + 1;
  }

  const rows = section.display_fields ?? [];

  if (section.style === "bullet_list") {
    let count = 0;
    for (const row of rows) {
      for (const f of row) {
        const val = resolveDecodedField(f, decoded);
        if (val === "-" || val === "") continue;
        const lines = val.split("\n").filter((l) => l.trim());
        count += lines.length;
      }
    }
    return h + count * BODY_LINE_H + 1;
  }

  // plain / table
  let count = 0;
  for (const row of rows) {
    const parts = row
      .map((f) => {
        const val = resolveDecodedField(f, decoded);
        return val === "-" || val === "" ? null : val;
      })
      .filter(Boolean);
    if (parts.length > 0) count++;
  }
  return h + count * BODY_LINE_H + 1;
}

// Szacuje łączną wysokość sekcji dla zadanych maxów — używane do scale-up.
function estimateSheetHeight(
  doc: jsPDF,
  sheet: LabelTemplateV2,
  decoded: DecodedSKU,
  titleMax: number,
  bodyMax: number,
  gap: number
): number {
  const savedT = CURRENT_TITLE_MAX, savedB = CURRENT_BODY_MAX, savedG = CURRENT_SECTION_GAP;
  CURRENT_TITLE_MAX = titleMax;
  CURRENT_BODY_MAX = bodyMax;
  CURRENT_SECTION_GAP = gap;
  try {
    const sections = (sheet.sections ?? []).filter((s) => {
      if (!s.condition_field) return true;
      return checkDecodedCondition(decoded, s.condition_field);
    });
    let total = 0;
    for (const s of sections) total += measureSection(doc, s, decoded);
    if (sections.length > 1) total += gap * (sections.length - 1);
    return total;
  } finally {
    CURRENT_TITLE_MAX = savedT;
    CURRENT_BODY_MAX = savedB;
    CURRENT_SECTION_GAP = savedG;
  }
}

// ─── Single-sheet render ─────────────────────────────────────────────────
// Zasada: każdy arkusz NA JEDNĄ STRONĘ. Skalujemy w górę, żeby wypełnić
// wysokość; w dół, żeby się zmieścić. Limity dolne: BODY_MIN/TITLE_MIN.
export function renderSheet(doc: jsPDF, sheet: LabelTemplateV2, decoded: DecodedSKU, isFirst: boolean) {
  if (!isFirst) doc.addPage([PAGE_W, PAGE_H], "portrait");

  let y = MARGIN_TOP;
  y = renderHeader(doc, sheet, decoded, y);
  if (sheet.show_meta_row) y = renderMetaRow(doc, decoded, y);
  const contentStartY = y;
  const available = PAGE_H - MARGIN_BOTTOM - contentStartY;

  // Policz wysokość przy default sizes i policz scale żeby content = available.
  const baseHeight = estimateSheetHeight(
    doc, sheet, decoded, TITLE_DEFAULT_MAX, BODY_DEFAULT_MAX, SECTION_GAP
  );

  // Scale = available / baseHeight. Clamp do rozsądnego zakresu.
  // Górne limity: tytuł/body hard cap. Dolne: MIN/DEFAULT (nie mniej niż 60%).
  const MIN_SCALE = 0.6;
  const MAX_SCALE_BY_BODY = BODY_HARD_CAP / BODY_DEFAULT_MAX;
  const MAX_SCALE_BY_TITLE = TITLE_HARD_CAP / TITLE_DEFAULT_MAX;
  const MAX_SCALE = Math.min(MAX_SCALE_BY_BODY, MAX_SCALE_BY_TITLE, 1.8);

  let scale = 1;
  if (baseHeight > 0) {
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, available / baseHeight));
  }

  CURRENT_TITLE_MAX = TITLE_DEFAULT_MAX * scale;
  CURRENT_BODY_MAX = BODY_DEFAULT_MAX * scale;
  CURRENT_SECTION_GAP = Math.max(2, SECTION_GAP * Math.min(scale, 1.5));
  CURRENT_HEADER_TEMPLATE = sheet.header_template;

  // Render sekcji — bez page-breaka! (max 1 strona na arkusz)
  const sections = sheet.sections ?? [];
  for (const section of sections) {
    const needed = measureSection(doc, section, decoded);
    if (needed === 0) continue; // conditional-skipped

    y = renderSection(doc, section, decoded, y);
    y += CURRENT_SECTION_GAP;
  }

  // Reset do defaultów po arkuszu
  CURRENT_TITLE_MAX = TITLE_DEFAULT_MAX;
  CURRENT_BODY_MAX = BODY_DEFAULT_MAX;
  CURRENT_SECTION_GAP = SECTION_GAP;
  CURRENT_HEADER_TEMPLATE = null;
  void contentStartY; // reserved for future use
}

// ─── Arkusz rozcięciowy S1 (preset — nie z DB) ───────────────────────────
// Per user: S1 generuje arkusz z 4 sekcjami do rozcięcia nożyczkami:
// Boczek LEWY, Boczek PRAWY, Skrzynia, Nogi (komplet siedzisko+skrzynia+pufa).
// Dane brane 1:1 z V1 label_templates dla komponentów side/chest/leg_seat/leg_chest.

interface V1Template {
  label_name: string;
  component: string;
  display_fields: unknown;
  quantity: number;
  sort_order: number;
}

function normalizeDisplayFields(fields: unknown): string[][] {
  if (!Array.isArray(fields) || fields.length === 0) return [[]];
  if (typeof fields[0] === "string") return [fields as string[]];
  return fields as string[][];
}

async function fetchV1Templates(
  productType: string,
  seriesCode: string,
  components: string[]
): Promise<V1Template[]> {
  const { data: series } = await supabase
    .from("products")
    .select("id")
    .eq("category", "series")
    .eq("code", seriesCode)
    .maybeSingle();

  if (!series) return [];

  // Try series-specific first
  const { data: seriesSpec } = await supabase
    .from("label_templates")
    .select("label_name, component, display_fields, quantity, sort_order")
    .eq("product_type", productType)
    .eq("series_id", series.id)
    .in("component", components)
    .order("sort_order");

  if (seriesSpec && seriesSpec.length > 0) return seriesSpec as V1Template[];

  // Fall back to global
  const { data: global } = await supabase
    .from("label_templates")
    .select("label_name, component, display_fields, quantity, sort_order")
    .eq("product_type", productType)
    .is("series_id", null)
    .in("component", components)
    .order("sort_order");

  return (global as V1Template[]) || [];
}

function buildContentLines(tpl: V1Template, decoded: DecodedSKU): string[] {
  const fieldGroups = normalizeDisplayFields(tpl.display_fields);
  const lines: string[] = [];
  for (const row of fieldGroups) {
    const parts = row
      .map((f) => {
        const val = resolveDecodedField(f, decoded);
        if (val === "-" || val === "") return null;
        return formatFieldWithLabel(f, val);
      })
      .filter(Boolean) as string[];
    if (parts.length > 0) lines.push(parts.join(" | "));
  }
  return lines;
}

interface CutSection {
  title: string;
  lines: string[];
}

export async function renderCutSheetS1(doc: jsPDF, decoded: DecodedSKU, isFirst: boolean): Promise<boolean> {
  // Fetch V1 templates for side/chest (nogi przeniesione do OPARCIE jako legs_list)
  const templates = await fetchV1Templates("sofa", "S1", ["side", "chest"]);
  if (templates.length === 0) return false; // nothing to render

  // Group by component
  const byComp: Record<string, V1Template[]> = {};
  for (const t of templates) {
    byComp[t.component] = byComp[t.component] || [];
    byComp[t.component].push(t);
  }

  // Build sections (3 × ~46mm, powiększone po usunięciu NOGI)
  const sections: CutSection[] = [];

  // 1. Boczek ×2 (identyczne L/P, więc ten sam tytuł)
  const sideTpls = byComp["side"] || [];
  const sideLines = sideTpls.flatMap((t) => buildContentLines(t, decoded));
  if (sideTpls.length > 0) {
    sections.push({ title: "BOCZEK", lines: sideLines });
    sections.push({ title: "BOCZEK", lines: sideLines });
  }

  // 2. Skrzynia
  const chestTpls = byComp["chest"] || [];
  if (chestTpls.length > 0) {
    const chestLines = chestTpls.flatMap((t) => buildContentLines(t, decoded));
    sections.push({ title: "SKRZYNIA", lines: chestLines });
  }

  if (sections.length === 0) return false;

  // Layout: 3 sections × 46mm + 2 gaps × 2mm + topMargin 8mm = 150mm ✅
  if (!isFirst) doc.addPage([PAGE_W, PAGE_H], "portrait");

  const sectionH = 46;
  const gapH = 2;
  const topMargin = 4;
  let y = topMargin;

  const orderNum = decoded.orderNumber || "---";
  const headerTemplate = `SOFA ${decoded.series.collection || decoded.series.name} [${decoded.series.code}]`;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];

    // Main header — taki sam styl jak główne etykiety V2 (duży order# + template LEFT)
    doc.setFont("Roboto", "bold");
    let oSize = ORDER_NUMBER_FONT;
    doc.setFontSize(oSize);
    const maxOrderW = CONTENT_W * 0.55;
    while (doc.getTextWidth(orderNum) > maxOrderW && oSize > 15) {
      oSize -= 1;
      doc.setFontSize(oSize);
    }
    const orderWidth = doc.getTextWidth(orderNum);
    doc.setTextColor(0, 0, 0);
    doc.text(orderNum, PAGE_W - MARGIN_X, y + oSize * 0.32, {
      align: "right",
      baseline: "alphabetic",
    });

    // Template LEFT — fit w pozostałej szerokości
    const tSize = fitFontSize(doc, headerTemplate, CONTENT_W - orderWidth - 3, {
      max: HEADER_FONT_MAX,
      min: HEADER_FONT_MIN,
      bold: true,
    });
    doc.setFont("Roboto", "bold");
    doc.setFontSize(tSize);
    doc.text(headerTemplate, MARGIN_X, y + oSize * 0.32, { baseline: "alphabetic" });

    const headerBottom = y + oSize * 0.45 + 1;

    // Czarna gruba linia pod headerem (jak w głównych etykietach V2)
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_X, headerBottom, PAGE_W - MARGIN_X, headerBottom);

    // Dostępna wysokość dla title + content
    const sectionBottom = y + sectionH;
    const contentAvail = sectionBottom - headerBottom - 2;

    // Oszacuj bazową wysokość: title + linie przy default sizes
    const baseLines = sec.lines.length;
    const baseH =
      TITLE_DEFAULT_MAX * LINE_HEIGHT_RATIO + 1 +
      baseLines * (BODY_DEFAULT_MAX * LINE_HEIGHT_RATIO);
    const scale = baseH > 0
      ? Math.max(0.7, Math.min(1.8, BODY_HARD_CAP / BODY_DEFAULT_MAX, TITLE_HARD_CAP / TITLE_DEFAULT_MAX, contentAvail / baseH))
      : 1;
    const titleSize = TITLE_DEFAULT_MAX * scale;
    const bodySize = BODY_DEFAULT_MAX * scale;

    // Title z auto-fit width (na wypadek długiego tytułu po scale)
    const titleText = `▸ ${sec.title}`;
    const tfSize = fitFontSize(doc, titleText, CONTENT_W, { max: titleSize, min: TITLE_MIN, bold: true });
    doc.setFont("Roboto", "bold");
    doc.setFontSize(tfSize);
    let contentY = headerBottom + tfSize * LINE_HEIGHT_RATIO;
    doc.text(titleText, MARGIN_X, contentY);
    contentY += 2;

    // Content — wspólny min size dla wszystkich linii w sekcji
    if (sec.lines.length > 0) {
      let minBodySize = bodySize;
      for (const line of sec.lines) {
        const t = `  ${line}`;
        minBodySize = Math.min(
          minBodySize,
          fitFontSize(doc, t, CONTENT_W, { max: bodySize, min: BODY_MIN })
        );
      }
      doc.setFont("Roboto", "normal");
      doc.setFontSize(minBodySize);
      const lineH = minBodySize * LINE_HEIGHT_RATIO;
      for (const line of sec.lines) {
        if (contentY + lineH > sectionBottom) break;
        doc.text(`  ${line}`, MARGIN_X, contentY + lineH * 0.75);
        contentY += lineH;
      }
    }

    // Cut-guide between sections (not after last)
    if (i < sections.length - 1) {
      doc.setLineDashPattern([1.2, 1], 0);
      doc.setDrawColor(80);
      doc.setLineWidth(0.25);
      const guideY = y + sectionH + gapH / 2;
      doc.line(MARGIN_X - 2, guideY, PAGE_W - MARGIN_X + 2, guideY);
      // Small scissors marker on left
      doc.setFontSize(6);
      doc.setTextColor(120);
      doc.text("✂", 1.5, guideY + 1.5);
      doc.setTextColor(0);
      // Reset dash pattern
      doc.setLineDashPattern([], 0);
    }

    y += sectionH + gapH;
  }

  return true;
}

// ─── V1 fallback for non-S1 series ───────────────────────────────────────
// S2/N2 don't have cut-sheet V2 templates (no side/leg labels in their product
// rules) but they still need a chest label. V2 solo for S2/N2 delegates to V1
// for component="chest" and returns the 100×30mm label as a separate small PDF.
async function renderV1ChestSmall(
  decoded: DecodedSKU,
  productType: string
): Promise<Blob | null> {
  const [templates, settings] = await Promise.all([
    fetchTemplates(productType, decoded.series.code),
    fetchLabelSettings(),
  ]);

  const chestTemplates = templates.filter(
    (t) => t.component === "chest" && shouldShow(decoded, t)
  );
  if (chestTemplates.length === 0) return null;

  const doc = await createDoc("landscape", [100, 30]);

  let isFirst = true;
  for (const tpl of chestTemplates) {
    const lines = buildLabelLines(decoded, tpl, productType, settings);
    for (let i = 0; i < tpl.quantity; i++) {
      addLabel(doc, lines, isFirst, settings);
      isFirst = false;
    }
  }

  if (isFirst) return null;
  return toBlob(doc);
}

// ─── Public API ──────────────────────────────────────────────────────────
export interface LabelsV2Result {
  large: Blob | null; // 100×150mm V2 sheets (or S1 cut sheet)
  small: Blob | null; // 100×30mm V1 chest fallback (S2/N2 sofa only)
}

export async function generateLabelsV2PDF(
  decoded: DecodedSKU,
  productType: "sofa" | "naroznik" | "pufa" | "fotel"
): Promise<LabelsV2Result> {
  const sheets = await fetchSheets(productType, decoded.series.code);
  const visible = sheets.filter((s) => shouldShowSheet(decoded, s));

  const doc = await createDoc("portrait", [PAGE_W, PAGE_H]);

  let isFirst = true;
  for (const sheet of visible) {
    renderSheet(doc, sheet, decoded, isFirst);
    isFirst = false;
  }

  // Arkusz rozcięciowy S1 — tylko dla sofa S1 (pokrywa side/chest/leg)
  const isSofaS1 = productType === "sofa" && decoded.series.code === "S1";
  if (isSofaS1) {
    const rendered = await renderCutSheetS1(doc, decoded, isFirst);
    if (rendered) isFirst = false;
  }

  let large: Blob | null;
  if (isFirst) {
    // Nothing rendered — placeholder page
    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    doc.text("Brak szablonów etykiet V2", MARGIN_X, MARGIN_TOP + 6);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(META_FONT);
    doc.text(`Typ: ${productType}, seria: ${decoded.series.code || "?"}`, MARGIN_X, MARGIN_TOP + 14);
    large = toBlob(doc);
  } else {
    large = toBlob(doc);
  }

  // V1 chest fallback for S2/N2 sofa/naroznik (S1 is covered by cut sheet,
  // pufa/fotel don't need it).
  let small: Blob | null = null;
  if (!isSofaS1 && (productType === "sofa" || productType === "naroznik")) {
    small = await renderV1ChestSmall(decoded, productType);
  }

  return { large, small };
}

// Legacy-style wrappers matching V1 entry points
export async function generateSofaLabelsV2PDF(decoded: DecodedSKU): Promise<LabelsV2Result> {
  const type = decoded.chaise ? "naroznik" : "sofa";
  return generateLabelsV2PDF(decoded, type);
}

export async function generatePufaLabelsV2PDF(decoded: DecodedSKU): Promise<LabelsV2Result> {
  return generateLabelsV2PDF(decoded, "pufa");
}

export async function generateFotelLabelsV2PDF(decoded: DecodedSKU): Promise<LabelsV2Result> {
  return generateLabelsV2PDF(decoded, "fotel");
}
