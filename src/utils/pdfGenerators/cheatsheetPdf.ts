import { createDoc, toBlob } from "@/utils/pdfHelpers";
import autoTable from "jspdf-autotable";
import type jsPDF from "jspdf";

// ─── Types ──────────────────────────────────────────────────────────

export interface CheatsheetPdfData {
  seriesCode: string;
  seriesName: string;
  collection: string;
  seatFrame: string | null;
  seatSpring: string | null;
  commonBaseFoam: string | null;
  fixedBackrest: string | null;
  fixedChest: string | null;
  fixedAutomat: string | null;
  seats: CheatsheetSeatRow[];
  seatGroups: { frame: string; seatIndices: number[] }[] | null;
  showModelCol: boolean;
  showSpringCol: boolean;
  showPiankiCol: boolean;
  backrests: CheatsheetBackrestRow[];
  sides: CheatsheetSideRow[];
}

export interface CheatsheetSeatRow {
  code: string;
  model?: string;
  type: string;
  spring?: string;
  isSpringException?: boolean;
  frontFoams: string;
  pianki: string;
  centerStrip: boolean;
}

export interface CheatsheetBackrestRow {
  code: string;
  models?: string;
  frame: string;
  height: string;
  springType: string;
  isSpringException: boolean;
  foams: string;
}

export interface CheatsheetSideRow {
  code: string;
  name: string;
  frame: string;
}

// ─── Generator ──────────────────────────────────────────────────────

export async function generateCheatsheetPDF(data: CheatsheetPdfData): Promise<Blob> {
  const doc = await createDoc("landscape", "a4");
  const pageW = doc.internal.pageSize.getWidth(); // 297
  const pageH = doc.internal.pageSize.getHeight(); // 210
  const mL = 15, mR = 15, mT = 12;
  const contentW = pageW - mL - mR;

  // ── Title ──
  doc.setFontSize(14);
  doc.setFont("Roboto", "bold");
  doc.text("Ściągawka: Magazyn stolarki i pianek", pageW / 2, mT + 5, { align: "center" });

  doc.setFontSize(12);
  doc.text(`${data.seriesCode} — ${data.seriesName}`, pageW / 2, mT + 12, { align: "center" });

  // ── Info-box ──
  let y = mT + 20;
  const boxH = 50;
  doc.setFillColor(245, 245, 245);
  doc.rect(mL, y, contentW, boxH, "F");

  const pad = 8;
  const colW = (contentW - 2 * pad) / 2;
  const lx = mL + pad;
  const rx = mL + pad + colW + 10;
  let ly = y + pad + 4;
  let ry = y + pad + 4;
  const lh = 7;

  function infoLine(x: number, yRef: number, label: string, value: string): number {
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.text(label, x, yRef);
    const labelW = doc.getTextWidth(label);
    doc.setFont("Roboto", "bold");
    doc.text(value, x + labelW + 1, yRef);
    return yRef + lh;
  }

  // Left column
  ly = infoLine(lx, ly, "Kolekcja: ", data.collection || "—");
  if (data.seatSpring) ly = infoLine(lx, ly, "Sprężyna siedziska: ", data.seatSpring);
  if (data.fixedChest) ly = infoLine(lx, ly, "Skrzynia: ", data.fixedChest);

  // Right column
  if (data.seatFrame) ry = infoLine(rx, ry, "Stelaż siedziska: ", data.seatFrame);
  if (data.commonBaseFoam) ry = infoLine(rx, ry, "Pianka bazowa (wszystkie): ", data.commonBaseFoam);
  if (data.fixedBackrest) ry = infoLine(rx, ry, "Oparcie: ", data.fixedBackrest);
  if (data.fixedAutomat) ry = infoLine(rx, ry, "Automat: ", data.fixedAutomat);

  y += boxH + 8;

  // ── Seats section ──
  if (data.seats.length > 0) {
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("Siedziska", mL, y + 4);
    y += 7;

    if (!data.showPiankiCol) {
      doc.setFontSize(8);
      doc.setFont("Roboto", "normal");
      doc.text("Pianka bazowa identyczna — różni się tylko front.", mL, y + 3);
      y += 6;
    }

    if (data.seatGroups) {
      for (const group of data.seatGroups) {
        const groupSeats = group.seatIndices.map(i => data.seats[i]);
        const hasException = groupSeats.some(s => s.isSpringException);
        doc.setFontSize(9);
        doc.setFont("Roboto", "bold");
        if (hasException) doc.setTextColor(200, 0, 0);
        doc.text(`Stelaż: ${group.frame}`, mL, y + 3);
        doc.setTextColor(0, 0, 0);
        y += 5;
        y = renderSeatsTable(doc, y, groupSeats, data, mL, contentW);
      }
    } else {
      y = renderSeatsTable(doc, y, data.seats, data, mL, contentW);
    }
  }

  // ── Backrests section ──
  if (data.backrests.length > 0) {
    if (y > pageH - 40) { doc.addPage(); y = mT; }
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Oparcia", mL, y + 4);
    y += 7;
    y = renderBackrestsTable(doc, y, data, mL, contentW);
  }

  // ── Sides section ──
  if (data.sides.length > 0) {
    if (y > pageH - 30) { doc.addPage(); y = mT; }
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Boczki", mL, y + 4);
    y += 7;

    const headers = ["Kod", "Nazwa (prod.)", "Stelaż"];
    const rows = data.sides.map(s => [s.code, s.name, s.frame]);
    autoTable(doc, {
      startY: y,
      head: [headers],
      body: rows,
      theme: "grid",
      tableWidth: contentW,
      margin: { left: mL, right: mR },
      styles: { font: "Roboto", fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], overflow: "linebreak" },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 25, fontStyle: "bold", font: "Roboto" } },
      showHead: "everyPage",
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Footer on each page ──
  const totalPages = doc.getNumberOfPages();
  const now = new Date().toLocaleDateString("pl-PL");
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Wygenerowano: ${now} | ${data.seriesCode} ${data.seriesName}`, pageW - mR, pageH - 5, { align: "right" });
  }
  doc.setTextColor(0, 0, 0);

  return toBlob(doc);
}

// ─── Table renderers ────────────────────────────────────────────────

function renderSeatsTable(
  doc: jsPDF,
  y: number,
  seats: CheatsheetSeatRow[],
  data: CheatsheetPdfData,
  mL: number,
  contentW: number
): number {
  const headers: string[] = ["Kod"];
  const colStyles: Record<number, any> = { 0: { cellWidth: 22, fontStyle: "bold", font: "Roboto" } };
  let colIdx = 1;

  if (data.showModelCol) { headers.push("Model"); colStyles[colIdx] = { cellWidth: 30 }; colIdx++; }
  headers.push("Typ"); colStyles[colIdx] = { cellWidth: 22 }; colIdx++;
  if (data.showSpringCol) { headers.push("Sprężyna"); colStyles[colIdx] = { cellWidth: 20 }; colIdx++; }
  headers.push("Pianka frontu"); colStyles[colIdx] = { cellWidth: 55 }; colIdx++;
  if (data.showPiankiCol) { headers.push("Pianki"); colStyles[colIdx] = { cellWidth: 55 }; colIdx++; }
  headers.push("Pasek śr. dokleić\n1.5 × 19 × 50 T-21-25"); colStyles[colIdx] = { cellWidth: 45 };

  const rows = seats.map(s => {
    const row: string[] = [s.code];
    if (data.showModelCol) row.push(s.model || "—");
    row.push(s.type);
    if (data.showSpringCol) row.push(s.spring || "—");
    row.push(s.frontFoams);
    if (data.showPiankiCol) row.push(s.pianki);
    row.push(s.centerStrip ? "TAK" : "—");
    return row;
  });

  // Build row-level styles for exceptions
  const springColIndex = data.showModelCol ? 3 : 2;

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    theme: "grid",
    tableWidth: contentW,
    margin: { left: mL, right: doc.internal.pageSize.getWidth() - mL - contentW },
    styles: { font: "Roboto", fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: colStyles,
    showHead: "everyPage",
    didParseCell: (hookData) => {
      if (hookData.section === "body") {
        const seatIdx = hookData.row.index;
        const seat = seats[seatIdx];
        if (seat?.isSpringException) {
          hookData.cell.styles.fillColor = [255, 235, 235];
          if (data.showSpringCol && hookData.column.index === (data.showModelCol ? 3 : 2)) {
            hookData.cell.styles.textColor = [200, 0, 0];
            hookData.cell.styles.fontStyle = "bold";
          }
        }
        // Bold TAK in center strip column
        const lastColIdx = headers.length - 1;
        if (hookData.column.index === lastColIdx && hookData.cell.text.join("") === "TAK") {
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 8;
}

function renderBackrestsTable(
  doc: jsPDF,
  y: number,
  data: CheatsheetPdfData,
  mL: number,
  contentW: number
): number {
  const headers: string[] = ["Kod"];
  const colStyles: Record<number, any> = { 0: { cellWidth: 20, fontStyle: "bold", font: "Roboto" } };
  let colIdx = 1;

  if (data.showModelCol) { headers.push("Modele"); colStyles[colIdx] = { cellWidth: 50 }; colIdx++; }
  headers.push("Stelaż"); colStyles[colIdx] = { cellWidth: 50 }; colIdx++;
  headers.push("Wysokość"); colStyles[colIdx] = { cellWidth: 25 }; colIdx++;
  headers.push("Sprężyna"); colStyles[colIdx] = { cellWidth: 25 }; colIdx++;
  headers.push("Pianki");

  const rows = data.backrests.map(b => {
    const row: string[] = [b.code];
    if (data.showModelCol) row.push(b.models || "—");
    row.push(b.frame);
    row.push(b.height);
    row.push(b.springType || "—");
    row.push(b.foams);
    return row;
  });

  const springIdx = data.showModelCol ? 4 : 3;

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    theme: "grid",
    tableWidth: contentW,
    margin: { left: mL, right: doc.internal.pageSize.getWidth() - mL - contentW },
    styles: { font: "Roboto", fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: colStyles,
    showHead: "everyPage",
    didParseCell: (hookData) => {
      if (hookData.section === "body") {
        const b = data.backrests[hookData.row.index];
        if (b?.isSpringException) {
          hookData.cell.styles.fillColor = [255, 235, 235];
          if (hookData.column.index === springIdx) {
            hookData.cell.styles.textColor = [200, 0, 0];
            hookData.cell.styles.fontStyle = "bold";
          }
        }
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 8;
}
