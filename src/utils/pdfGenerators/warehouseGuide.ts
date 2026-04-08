import { DecodedSKU, ProductFoamItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { createDoc, addTable, toBlob } from "@/utils/pdfHelpers";

// ─── Settings ────────────────────────────────────────────────────────
/**
 * Fetch guide settings from DB (singleton).
 */
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

/**
 * Lock bolt positions — hardcoded rules per series × automat.
 */
function getLockBoltPositions(seriesCode: string, automatCode: string): string {
  if (seriesCode === "S1" && automatCode === "AT2") return "Poz. 1 i 3";
  return "Poz. 1 i 2";
}

/**
 * Format foam items into table rows: [Name, Dimensions, Material, Quantity]
 */
function foamsToRows(foams?: ProductFoamItem[]): string[][] {
  if (!foams || foams.length === 0) return [];
  return foams.map(f => {
    const dims = [f.height, f.width, f.length].filter(v => v != null).join("×");
    return [
      f.name || "-",
      dims || "-",
      f.material || "-",
      String(f.quantity ?? 1),
    ];
  });
}

interface SectionBlock {
  title: string;
  tables: { headers: string[]; rows: string[][] }[];
}

/**
 * Hardcoded warehouse guide PDF generator — single PDF with sofa + conditional pufa + conditional fotel.
 */
export async function generateWarehouseGuidePDF(decoded: DecodedSKU): Promise<Blob> {
  const [doc, gs] = await Promise.all([
    createDoc("portrait", "a4"),
    fetchGuideSettings(),
  ]);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginTop = 15;
  const marginBottom = 10;

  const hasPufa = decoded.extras.some(e => e.type === "pufa") || !!decoded.pufaSKU;
  const hasFotel = decoded.extras.some(e => e.type === "fotel") || !!decoded.fotelSKU;

  // ──── HEADER ────
  let y = marginTop;

  const orderNumber = decoded.orderNumber || "";
  const orderDate = decoded.orderDate || "";

  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`ZAMÓWIENIE: ${orderNumber}`, marginLeft, y);

  const dateLabel = "Data: ";
  const dateValue = orderDate;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(11);
  const dateLabelWidth = doc.getTextWidth(dateLabel);
  const dateValueWidth = doc.getTextWidth(dateValue);
  const dateRightX = pageWidth - marginLeft;
  doc.text(dateLabel, dateRightX - dateLabelWidth - dateValueWidth, y);
  doc.setFont("Roboto", "bold");
  doc.setFontSize(11);
  doc.text(dateValue, dateRightX - dateValueWidth, y);

  y += 7;

  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  doc.text(`${decoded.series.code} — ${decoded.series.collection}`, marginLeft, y);
  y += 6;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.text(`SKU: ${decoded.rawSKU || ""}`, marginLeft, y);
  y += 4;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, pageWidth - marginLeft, y);
  y += 6;

  const headerHeight = y - marginTop;

  // ──── BUILD SECTIONS ────
  const sections: SectionBlock[] = [];

  // SIEDZISKO
  const seatSection: SectionBlock = {
    title: "SIEDZISKO",
    tables: [],
  };

  const lockBolts = getLockBoltPositions(decoded.series.code, decoded.automat.code);
  const seatHeaders = ["Kod", "Stelaż", "Sprężyna", "Śruby zamkowe"];
  const seatRow = [
    decoded.seat.code,
    decoded.seat.frame || "-",
    decoded.seat.springType || "-",
    lockBolts,
  ];

  if (decoded.seat.frameModification) {
    seatHeaders.push("Modyfikacja");
    seatRow.push(decoded.seat.frameModification);
  }

  seatSection.tables.push({
    headers: seatHeaders,
    rows: [seatRow],
  });

  const seatFoamRows = foamsToRows(decoded.seat.foams);
  if (decoded.seat.midStrip) {
    const hasMidStripFoam = decoded.seat.foams?.some(f =>
      f.name?.toLowerCase().includes("pasek") || f.name?.toLowerCase().includes("strip")
    );
    if (!hasMidStripFoam) {
      seatFoamRows.push(["Pasek środkowy", "1.5×19×50", "T-2125", "1"]);
    }
  }
  if (seatFoamRows.length > 0) {
    seatSection.tables.push({
      headers: ["Nazwa", "Wymiary", "Materiał", "Ilość"],
      rows: seatFoamRows,
    });
  }
  sections.push(seatSection);

  // OPARCIE
  const backrestSection: SectionBlock = {
    title: "OPARCIE",
    tables: [],
  };
  backrestSection.tables.push({
    headers: ["Kod", "Stelaż", "Sprężyna"],
    rows: [[
      decoded.backrest.code,
      decoded.backrest.frame || "-",
      decoded.backrest.springType || "-",
    ]],
  });
  const backrestFoamRows = foamsToRows(decoded.backrest.foams);
  if (backrestFoamRows.length > 0) {
    backrestSection.tables.push({
      headers: ["Nazwa", "Wymiary", "Materiał", "Ilość"],
      rows: backrestFoamRows,
    });
  }
  sections.push(backrestSection);

  // BOCZEK
  sections.push({
    title: "BOCZEK",
    tables: [{
      headers: ["Kod", "Stelaż", "Piankowanie"],
      rows: [[decoded.side.code, decoded.side.frame || "-", decoded.side.name || "-"]],
    }],
  });

  // SKRZYNIA + AUTOMAT
  const automatLabel = decoded.automat.code + (decoded.automat.name ? ` — ${decoded.automat.name}` : "");
  sections.push({
    title: "SKRZYNIA + AUTOMAT",
    tables: [{
      headers: ["Skrzynia", "Automat"],
      rows: [[decoded.chest.name || decoded.chest.code || "-", automatLabel]],
    }],
  });

  // PUFA — conditional
  if (hasPufa && decoded.pufaSeat) {
    const pufaFoamRows: string[][] = [];
    if (decoded.pufaSeat.foams && decoded.pufaSeat.foams.length > 0) {
      pufaFoamRows.push(...foamsToRows(decoded.pufaSeat.foams));
    } else {
      if (decoded.pufaSeat.foam) pufaFoamRows.push(["Pianka bazy", decoded.pufaSeat.foam, "-", "1"]);
      if (decoded.pufaSeat.frontBack) pufaFoamRows.push(["Przód/tył", decoded.pufaSeat.frontBack, "-", "1"]);
      if (decoded.pufaSeat.sides) pufaFoamRows.push(["Boki", decoded.pufaSeat.sides, "-", "1"]);
    }
    if (pufaFoamRows.length > 0) {
      sections.push({
        title: "PUFA — CZAPA",
        tables: [{
          headers: ["Nazwa", "Wymiary", "Materiał", "Ilość"],
          rows: pufaFoamRows,
        }],
      });
    }

    if (decoded.pufaSeat.box) {
      sections.push({
        title: "PUFA — SKRZYNKA",
        tables: [{
          headers: ["Wys. skrzynki"],
          rows: [[decoded.pufaSeat.box]],
        }],
      });
    }
  }

  // FOTEL — conditional
  if (hasFotel) {
    sections.push({
      title: "FOTEL",
      tables: [{
        headers: ["Front siedziska", "Boczek", "Stelaż boczka", "Piankowanie"],
        rows: [[decoded.seat.front || "-", decoded.side.code, decoded.side.frame || "-", decoded.side.name || "-"]],
      }],
    });
  }

  // ──── CALCULATE DYNAMIC SPACING ────
  const TITLE_HEIGHT = gs.font_size_header * 0.4 + 3;
  const TABLE_HEADER_HEIGHT = gs.table_row_height + 2;
  const TABLE_ROW_HEIGHT = gs.table_row_height;

  let totalContentHeight = 0;
  for (const section of sections) {
    totalContentHeight += TITLE_HEIGHT;
    for (const table of section.tables) {
      totalContentHeight += TABLE_HEADER_HEIGHT + table.rows.length * TABLE_ROW_HEIGHT;
    }
    if (section.tables.length > 1) {
      totalContentHeight += 8 * (section.tables.length - 1);
    }
  }

  const hasSeparator = hasPufa || hasFotel;
  if (hasSeparator) totalContentHeight += 10;

  const availableHeight = pageHeight - marginTop - marginBottom - headerHeight;
  const numGaps = sections.length - 1;
  let sectionSpacing = numGaps > 0
    ? (availableHeight - totalContentHeight) / numGaps
    : 8;
  sectionSpacing = Math.max(10, Math.min(14, sectionSpacing));

  // ──── RENDER SECTIONS ────
  const coreCount = hasPufa || hasFotel
    ? sections.findIndex(s => s.title.startsWith("PUFA") || s.title === "FOTEL")
    : sections.length;

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];

    if (hasSeparator && si === coreCount && si > 0) {
      y += 4;
      doc.setDrawColor(150, 150, 150);
      doc.setLineDashPattern([2, 2], 0);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, y, pageWidth - marginLeft, y);
      doc.setLineDashPattern([], 0);
      y += 6;
    } else if (si > 0) {
      y += sectionSpacing;
    }

    doc.setFont("Roboto", "bold");
    doc.setFontSize(gs.font_size_header);
    doc.setTextColor(0, 0, 0);
    doc.text(section.title, marginLeft, y);
    y += 3;

    for (let ti = 0; ti < section.tables.length; ti++) {
      const table = section.tables[ti];

      if (ti === 1) {
        const foamLabel = section.title === "SIEDZISKO" ? "Pianki siedziska:" :
                          section.title === "OPARCIE" ? "Pianki oparcia:" : "";
        if (foamLabel) {
          y += 5;
          doc.setFont("Roboto", "bold");
          doc.setFontSize(9);
          doc.text(foamLabel, marginLeft + 2, y);
          y += 3;
        }
      }

      y = addTable(doc, y, table.headers, table.rows, undefined, 0, gs.font_size_table, gs.table_row_height);
    }
  }

  // ── SPECIAL NOTES (e.g. SD01N + B9B listwa) ──
  if (decoded.specialNotes && decoded.specialNotes.length > 0) {
    y += 6;
    for (const note of decoded.specialNotes) {
      doc.setFillColor(255, 255, 200);
      doc.setDrawColor(200, 150, 0);
      doc.setLineWidth(0.5);
      doc.rect(marginLeft, y - 5, pageWidth - 2 * marginLeft, 10, "FD");
      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(note, marginLeft + 3, y + 1);
      y += 14;
    }
  }

  return toBlob(doc);
}
