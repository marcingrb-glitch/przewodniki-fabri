import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

let fontLoaded = false;
let regularFontBase64: string | null = null;
let boldFontBase64: string | null = null;

async function loadFonts() {
  if (fontLoaded) return;

  const [regularRes, boldRes] = await Promise.all([
    fetch("/fonts/Roboto-Regular.ttf"),
    fetch("/fonts/Roboto-Bold.ttf"),
  ]);

  const [regularBuf, boldBuf] = await Promise.all([
    regularRes.arrayBuffer(),
    boldRes.arrayBuffer(),
  ]);

  regularFontBase64 = arrayBufferToBase64(regularBuf);
  boldFontBase64 = arrayBufferToBase64(boldBuf);
  fontLoaded = true;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function registerFonts(doc: jsPDF) {
  if (regularFontBase64) {
    doc.addFileToVFS("Roboto-Regular.ttf", regularFontBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  }
  if (boldFontBase64) {
    doc.addFileToVFS("Roboto-Bold.ttf", boldFontBase64);
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  }
  doc.setFont("Roboto", "normal");
}

export async function createDoc(orientation: "portrait" | "landscape" = "portrait", format: number[] | string = "a4"): Promise<jsPDF> {
  await loadFonts();
  const doc = new jsPDF({ orientation, unit: "mm", format });
  registerFonts(doc);
  return doc;
}

export function addHeader(
  doc: jsPDF,
  orderNumber: string,
  seriesInfo: string,
  date: string,
  prefix?: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 15;
  const right = pageWidth - 15;

  doc.setFontSize(12);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  const title = prefix ? `${prefix} | NUMER ZAMÓWIENIA: ${orderNumber}` : `NUMER ZAMÓWIENIA: ${orderNumber}`;
  doc.text(title, left, 15);

  doc.setFontSize(11);
  doc.setFont("Roboto", "normal");
  doc.text(`[${seriesInfo}]`, right, 15, { align: "right" });

  // Date
  doc.setFontSize(12);
  doc.setFont("Roboto", "bold");
  doc.text(`Data złożenia zamówienia: ${date}`, left, 23);

  doc.setFont("Roboto", "normal");
  doc.setTextColor(0, 0, 0);
  return 28;
}

// addSectionTitle removed - section names are in table headers

export interface ColumnStyles {
  [key: string]: { cellWidth: number };
}

export function addTable(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
  columnStyles?: ColumnStyles,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const tableWidth = pageWidth - 2 * margin;

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    theme: "grid",
    tableWidth: tableWidth,
    margin: { left: margin, right: margin },
    columnStyles: columnStyles || {},
    styles: {
      font: "Roboto",
      fontSize: 10,
      cellPadding: 2.5,
      overflow: "linebreak",
      minCellHeight: 8,
      valign: "middle",
      halign: "left",
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
  });

  return (doc as any).lastAutoTable.finalY + 8;
}

export function addInfoBox(doc: jsPDF, y: number, text: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(15, y, pageWidth - 30, 10);
  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(text, 20, y + 7);
  return y + 14;
}

export function addLabel(
  doc: jsPDF,
  lines: string[],
  isFirst: boolean
) {
  if (!isFirst) {
    doc.addPage([100, 30]);
  }

  const pageW = 100;
  const pageH = 30;
  const marginY = 2;

  doc.setTextColor(0, 0, 0);
  if (lines.length === 0) return;

  const seriesText = lines[0];
  const mainLines = lines.slice(1);

  // --- Left rotated series info (three-part: code, name, collection) ---
  const leftZoneWidth = 16; // mm reserved for rotated text
  const maxSeriesLen = pageH - 2 * marginY;

  // Split series text: "S1|Sofa Mar|Viena" → code="S1", name="Sofa Mar", collection="Viena"
  const parts = seriesText.split("|");
  const seriesCode = parts[0] || "";
  const seriesName = parts[1] || "";
  const seriesCollection = parts[2] ? `[${parts[2]}]` : "";

  // Draw large series code (e.g. "S1") rotated 90° CCW
  doc.setFont("Roboto", "bold");
  let codeFontSize = 18;
  doc.setFontSize(codeFontSize);
  while (doc.getTextWidth(seriesCode) > maxSeriesLen && codeFontSize > 8) {
    codeFontSize -= 0.5;
    doc.setFontSize(codeFontSize);
  }
  const codeX = codeFontSize * 0.35 + 1;
  const codeY = pageH / 2 + doc.getTextWidth(seriesCode) / 2;
  doc.text(seriesCode, codeX, codeY, { angle: 90 });

  // Draw name (e.g. "Sofa Mar") rotated 90° CCW
  let nextX = codeX + codeFontSize * 0.35 + 1;
  if (seriesName) {
    doc.setFont("Roboto", "bold");
    let nameFontSize = 9;
    doc.setFontSize(nameFontSize);
    while (doc.getTextWidth(seriesName) > maxSeriesLen && nameFontSize > 4) {
      nameFontSize -= 0.5;
      doc.setFontSize(nameFontSize);
    }
    const nameY = pageH / 2 + doc.getTextWidth(seriesName) / 2;
    doc.text(seriesName, nextX, nameY, { angle: 90 });
    nextX += nameFontSize * 0.35 + 0.8;
  }

  // Draw collection (e.g. "[Viena]") rotated 90° CCW
  if (seriesCollection) {
    doc.setFont("Roboto", "normal");
    let collFontSize = 7;
    doc.setFontSize(collFontSize);
    while (doc.getTextWidth(seriesCollection) > maxSeriesLen && collFontSize > 4) {
      collFontSize -= 0.5;
      doc.setFontSize(collFontSize);
    }
    const collY = pageH / 2 + doc.getTextWidth(seriesCollection) / 2;
    doc.text(seriesCollection, nextX, collY, { angle: 90 });
  }

  // --- Main content (shifted right) ---
  if (mainLines.length === 0) return;

  const contentLeft = leftZoneWidth;
  const contentRight = pageW - 3;
  const contentWidth = contentRight - contentLeft;
  const contentCenterX = contentLeft + contentWidth / 2;

  doc.setFont("Roboto", "bold");
  const availableHeight = pageH - 2 * marginY;
  let mainFontSize = Math.min(14, availableHeight / mainLines.length * 2);
  let fits = false;
  while (!fits && mainFontSize > 7) {
    doc.setFontSize(mainFontSize);
    fits = mainLines.every(line => doc.getTextWidth(line) <= contentWidth);
    if (!fits) mainFontSize -= 0.5;
  }

  doc.setFontSize(mainFontSize);
  const lineHeight = mainFontSize * 0.45;
  const totalTextHeight = mainLines.length * lineHeight;
  const startY = marginY + (availableHeight - totalTextHeight) / 2 + lineHeight * 0.7;

  mainLines.forEach((line, i) => {
    doc.text(line, contentCenterX, startY + i * lineHeight, { align: "center" });
  });
}

export function toBlob(doc: jsPDF): Blob {
  const arrayBuffer = doc.output("arraybuffer");
  return new Blob([arrayBuffer], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
