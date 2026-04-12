import { DecodedSKU } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { createDoc, addTableAt, toBlob } from "@/utils/pdfHelpers";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Settings ────────────────────────────────────────────────────────
async function fetchGuideSettings() {
  const { data } = await supabase
    .from("guide_settings")
    .select("*")
    .limit(1)
    .single();
  return data
    ? {
        font_size_header: Number(data.font_size_header) || 11,
        font_size_table: Number(data.font_size_table) || 9,
        table_row_height: Number(data.table_row_height) || 8,
      }
    : { font_size_header: 11, font_size_table: 9, table_row_height: 8 };
}

// ─── White-trim image ────────────────────────────────────────────────
async function trimWhiteBackground(imageUrl: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const WHITE_THRESHOLD = 245;

  let top = height, bottom = 0, left = width, right = 0;
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const i = (py * width + px) * 4;
      if (data[i] < WHITE_THRESHOLD || data[i + 1] < WHITE_THRESHOLD || data[i + 2] < WHITE_THRESHOLD) {
        if (py < top) top = py;
        if (py > bottom) bottom = py;
        if (px < left) left = px;
        if (px > right) right = px;
      }
    }
  }

  const pad = 2;
  top = Math.max(0, top - pad);
  bottom = Math.min(height - 1, bottom + pad);
  left = Math.max(0, left - pad);
  right = Math.min(width - 1, right + pad);

  const cropW = right - left + 1;
  const cropH = bottom - top + 1;
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext("2d")!;
  cropCtx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);

  return cropCanvas.toDataURL("image/jpeg", 0.9);
}

// ─── Placeholder ─────────────────────────────────────────────────────
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

// ─── Shared header ───────────────────────────────────────────────────
function drawProductionHeader(
  doc: any,
  decoded: DecodedSKU,
  prefix?: string,
  settings?: { font_size_header: number }
): number {
  const marginLeft = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const right = pageWidth - marginLeft;
  const fsH = settings?.font_size_header || 11;

  let y = 15;

  doc.setFontSize(16);
  doc.setFont("Roboto", "bold");
  const titleText = prefix
    ? `${prefix} — ZAM: ${decoded.orderNumber || ""}`
    : `ZAMÓWIENIE: ${decoded.orderNumber || ""}`;
  doc.text(titleText, marginLeft, y);

  doc.setFontSize(fsH);
  doc.setFont("Roboto", "normal");
  doc.text("Data: ", right - 40, y);
  const dateW = doc.getTextWidth("Data: ");
  doc.setFont("Roboto", "bold");
  doc.text(decoded.orderDate || "", right - 40 + dateW, y);
  y += 7;

  doc.setFontSize(14);
  doc.setFont("Roboto", "bold");
  const orientationLabel = decoded.orientation === "L" ? " (Lewy)" : decoded.orientation === "P" ? " (Prawy)" : "";
  const widthLabel = decoded.width ? ` ${decoded.width}cm` : "";
  doc.text(`${decoded.series.code} — ${decoded.series.collection || decoded.series.name}${widthLabel}${orientationLabel}`, marginLeft, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.text(`SKU: ${decoded.rawSKU || ""}`, marginLeft, y);
  y += 5;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, right, y);
  y += 6;

  return y;
}

// ─── Draw variant image ──────────────────────────────────────────────
async function drawVariantImage(
  doc: any,
  y: number,
  variantImageUrl?: string
): Promise<number> {
  const imageX = 15;
  const imageW = 180;
  const imageH = 60;

  if (variantImageUrl) {
    try {
      let base64: string;
      try {
        base64 = await trimWhiteBackground(variantImageUrl);
      } catch {
        const response = await fetch(variantImageUrl);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

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

  return y + imageH + 10;
}

// ─── Section header renderer ────────────────────────────────────────
function drawSectionHeader(doc: any, x: number, y: number, title: string, code?: string): number {
  doc.setFontSize(11);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  let text = title.toUpperCase();
  if (code) {
    const titleWidth = doc.getTextWidth(text + " — ");
    doc.text(text + " — ", x, y);
    doc.setFont("Roboto", "normal");
    doc.text(code, x + titleWidth, y);
  } else {
    doc.text(text, x, y);
  }
  return y + 3;
}

// ─── Section render helper ───────────────────────────────────────────
interface SectionDef {
  title: string;
  code?: string;
  headers: string[];
  rows: string[][];
  fullWidth?: boolean;
}

function renderSectionAt(
  doc: any,
  section: SectionDef,
  x: number,
  y: number,
  width: number,
  fs: number,
  rh: number,
  spacing: number
): number {
  y = drawSectionHeader(doc, x, y, section.title, section.code);
  y = addTableAt(doc, y, section.headers, section.rows, x, width, undefined, spacing, fs, rh);
  return y;
}

// ═══════════════════════════════════════════════════════════════════════
// SOFA PRODUCTION GUIDE
// ═══════════════════════════════════════════════════════════════════════
export async function generateProductionGuidePDF(
  decoded: DecodedSKU,
  variantImageUrl?: string
): Promise<Blob> {
  const [doc, settings] = await Promise.all([
    createDoc("portrait", "a4"),
    fetchGuideSettings(),
  ]);

  const fs = settings.font_size_table;
  const rh = settings.table_row_height;
  const sp = 3;

  let y = drawProductionHeader(doc, decoded, undefined, settings);
  y = await drawVariantImage(doc, y, variantImageUrl);

  const colLeftX = 15;
  const colRightX = 108;
  const colW = 87;
  const sectionGap = 8;

  // LEFT COLUMN
  let yL = y;

  yL = renderSectionAt(doc, {
    title: "TKANINA",
    code: `${decoded.fabric.code}${decoded.fabric.color}`,
    headers: ["Nazwa", "Kolor"],
    rows: [[decoded.fabric.name, decoded.fabric.colorName || decoded.fabric.color]],
  }, colLeftX, yL, colW, fs, rh, sp);
  yL += sectionGap;

  yL = renderSectionAt(doc, {
    title: "SIEDZISKO",
    code: `${decoded.seat.code}${decoded.seat.finish}`,
    headers: ["Typ", "Wykończenie"],
    rows: [[decoded.seat.type || decoded.seat.modelName || "-", decoded.seat.finishName]],
  }, colLeftX, yL, colW, fs, rh, sp);
  yL += sectionGap;

  yL = renderSectionAt(doc, {
    title: "OPARCIE",
    code: `${decoded.backrest.code}${decoded.backrest.finish}`,
    headers: ["Wykończenie", "Wariant szycia"],
    rows: [[decoded.backrest.finishName, decoded.backrest.top || "-"]],
  }, colLeftX, yL, colW, fs, rh, sp);

  // RIGHT COLUMN
  let yR = y;

  yR = renderSectionAt(doc, {
    title: "BOCZEK",
    code: `${decoded.side.code}${decoded.side.finish}`,
    headers: ["Nazwa", "Wykończenie"],
    rows: [[decoded.side.name || decoded.side.modelName || "-", decoded.side.finishName]],
  }, colRightX, yR, colW, fs, rh, sp);
  yR += sectionGap;

  yR = renderSectionAt(doc, {
    title: "SKRZYNIA + AUTOMAT",
    headers: ["Skrzynia", "Automat"],
    rows: [[decoded.chest.code, `${decoded.automat.code} - ${decoded.automat.name}`]],
  }, colRightX, yR, colW, fs, rh, sp);
  yR += sectionGap;

  const legName = decoded.legs?.name || "";
  const legColor = decoded.legs?.colorName || "";
  const legLabel = [legName, legColor].filter(Boolean).join(" ");

  const chestLegHeader = decoded.legHeights.sofa_chest
    ? `Pod skrzynię (${decoded.legHeights.sofa_chest.count} szt)`
    : "Pod skrzynię";
  const chestLegValue = decoded.legHeights.sofa_chest
    ? `${legLabel} H ${decoded.legHeights.sofa_chest.height}cm`
    : "-";

  const seatLegHeader = decoded.legHeights.sofa_seat
    ? `Pod siedzisko (${decoded.legHeights.sofa_seat.count} szt)`
    : null;
  const seatLegValue = decoded.legHeights.sofa_seat
    ? `${legLabel} H ${decoded.legHeights.sofa_seat.height}cm`
    : null;

  const legHeaders = seatLegHeader ? [chestLegHeader, seatLegHeader] : [chestLegHeader];
  const legRow = seatLegValue ? [chestLegValue, seatLegValue] : [chestLegValue];

  yR = renderSectionAt(doc, {
    title: "NÓŻKI",
    code: decoded.legs ? `${decoded.legs.code}${decoded.legs.color || ""}` : undefined,
    headers: legHeaders,
    rows: [legRow],
  }, colRightX, yR, colW, fs, rh, sp);

  // ── Full-width sections ──
  y = Math.max(yL, yR) + sectionGap;
  const fullW = 180;

  if (decoded.pillow) {
    y = renderSectionAt(doc, {
      title: "PODUSZKA",
      code: decoded.pillow.code,
      headers: ["Nazwa", "Wykończenie", "Wygląd", "Wkład"],
      rows: [[
        decoded.pillow.name,
        decoded.pillow.finishName,
        capitalize(decoded.pillow.constructionType || "-"),
        capitalize(decoded.pillow.insertType || "-"),
      ]],
    }, colLeftX, y, fullW, fs, rh, sp);
    y += sectionGap;
  }

  const hasJaski = !!decoded.jaski;
  const hasWalek = !!decoded.walek;
  if (hasJaski && hasWalek) {
    y = renderSectionAt(doc, {
      title: "JAŚKI / WAŁEK",
      code: `${decoded.jaski!.code} / ${decoded.walek!.code}`,
      headers: ["Jasiek", "Wykończenie", "Wałek", "Wykończenie"],
      rows: [[decoded.jaski!.name, decoded.jaski!.finishName, decoded.walek!.name, decoded.walek!.finishName]],
    }, colLeftX, y, fullW, fs, rh, sp);
  } else if (hasJaski) {
    y = renderSectionAt(doc, {
      title: "JAŚKI",
      code: decoded.jaski!.code,
      headers: ["Nazwa", "Wykończenie"],
      rows: [[decoded.jaski!.name, decoded.jaski!.finishName]],
    }, colLeftX, y, fullW, fs, rh, sp);
  } else if (hasWalek) {
    y = renderSectionAt(doc, {
      title: "WAŁEK",
      code: decoded.walek!.code,
      headers: ["Nazwa", "Wykończenie"],
      rows: [[decoded.walek!.name, decoded.walek!.finishName]],
    }, colLeftX, y, fullW, fs, rh, sp);
  }

  // ── Chaise section (narożnik only) ──
  if (decoded.chaise) {
    y = renderSectionAt(doc, {
      title: "SZEZLONG",
      code: decoded.chaise.code,
      headers: ["Siedzisko", "Wykończenie", "Oparcie", "Wykończenie"],
      rows: [[
        decoded.seat.type || decoded.seat.modelName || "-",
        decoded.seat.finishName,
        decoded.seat.type || decoded.seat.modelName || "-",
        decoded.backrest.finishName,
      ]],
    }, colLeftX, y, fullW, fs, rh, sp);
  }

  return toBlob(doc);
}

// ═══════════════════════════════════════════════════════════════════════
// PUFA PRODUCTION GUIDE
// ═══════════════════════════════════════════════════════════════════════
export async function generatePufaProductionGuidePDF(decoded: DecodedSKU): Promise<Blob> {
  const [doc, settings] = await Promise.all([
    createDoc("portrait", "a4"),
    fetchGuideSettings(),
  ]);

  const fs = settings.font_size_table;
  const rh = settings.table_row_height;
  const sp = 3;
  const fullW = 180;
  const x = 15;
  const sectionGap = 10;

  let y = drawProductionHeader(doc, decoded, "PUFA", settings);

  y = renderSectionAt(doc, {
    title: "TKANINA",
    code: `${decoded.fabric.code}${decoded.fabric.color}`,
    headers: ["Nazwa", "Kolor"],
    rows: [[decoded.fabric.name, decoded.fabric.colorName || decoded.fabric.color]],
  }, x, y, fullW, fs, rh, sp);
  y += sectionGap;

  y = renderSectionAt(doc, {
    title: "SIEDZISKO PUFY",
    code: decoded.seat.code + decoded.seat.finish,
    headers: ["Wykończenie"],
    rows: [[decoded.seat.finishName]],
  }, x, y, fullW, fs, rh, sp);
  y += sectionGap;

  if (decoded.pufaLegs) {
    y = renderSectionAt(doc, {
      title: "NÓŻKI",
      code: decoded.pufaLegs.code,
      headers: ["Nazwa", "Wysokość", "Ilość"],
      rows: [[
        [decoded.legs?.name || decoded.pufaLegs.code, decoded.legs?.colorName || ""].filter(Boolean).join(" "),
        `${decoded.pufaLegs.height}cm`,
        `${decoded.pufaLegs.count} szt`,
      ]],
    }, x, y, fullW, fs, rh, sp);
  }

  return toBlob(doc);
}

// ═══════════════════════════════════════════════════════════════════════
// FOTEL PRODUCTION GUIDE
// ═══════════════════════════════════════════════════════════════════════
export async function generateFotelProductionGuidePDF(decoded: DecodedSKU): Promise<Blob> {
  const [doc, settings] = await Promise.all([
    createDoc("portrait", "a4"),
    fetchGuideSettings(),
  ]);

  const fs = settings.font_size_table;
  const rh = settings.table_row_height;
  const sp = 3;
  const fullW = 180;
  const x = 15;
  const sectionGap = 10;

  let y = drawProductionHeader(doc, decoded, "FOTEL", settings);

  y = renderSectionAt(doc, {
    title: "TKANINA",
    code: `${decoded.fabric.code}${decoded.fabric.color}`,
    headers: ["Nazwa", "Kolor"],
    rows: [[decoded.fabric.name, decoded.fabric.colorName || decoded.fabric.color]],
  }, x, y, fullW, fs, rh, sp);
  y += sectionGap;

  y = renderSectionAt(doc, {
    title: "SIEDZISKO FOTELA",
    code: decoded.seat.code + decoded.seat.finish,
    headers: ["Wykończenie"],
    rows: [[decoded.seat.finishName]],
  }, x, y, fullW, fs, rh, sp);
  y += sectionGap;

  y = renderSectionAt(doc, {
    title: "BOCZEK",
    code: `${decoded.side.code}${decoded.side.finish}`,
    headers: ["Nazwa", "Wykończenie"],
    rows: [[decoded.side.name || decoded.side.modelName || "-", decoded.side.finishName]],
  }, x, y, fullW, fs, rh, sp);
  y += sectionGap;

  if (decoded.jaski) {
    y = renderSectionAt(doc, {
      title: "JAŚKI",
      code: decoded.jaski.code,
      headers: ["Nazwa", "Wykończenie"],
      rows: [[decoded.jaski.name, decoded.jaski.finishName]],
    }, x, y, fullW, fs, rh, sp);
    y += sectionGap;
  }

  if (decoded.fotelLegs) {
    y = renderSectionAt(doc, {
      title: "NÓŻKI",
      code: decoded.fotelLegs.code,
      headers: ["Nazwa", "Wysokość", "Ilość"],
      rows: [[
        [decoded.legs?.name || decoded.fotelLegs.code, decoded.legs?.colorName || ""].filter(Boolean).join(" "),
        `${decoded.fotelLegs.height}cm`,
        `${decoded.fotelLegs.count} szt`,
      ]],
    }, x, y, fullW, fs, rh, sp);
  }

  return toBlob(doc);
}
