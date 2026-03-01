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

  const marginX = 3;
  const marginTop = 2;
  const pageW = 100;
  const pageH = 30;
  const contentWidth = pageW - 2 * marginX;

  doc.setTextColor(0, 0, 0);

  if (lines.length === 0) return;

  // First line = series info (small, normal weight, top)
  const seriesLine = lines[0];
  const mainLines = lines.slice(1);

  // Draw series line - small font at top
  doc.setFont("Roboto", "normal");
  let seriesFontSize = 7;
  doc.setFontSize(seriesFontSize);
  while (doc.getTextWidth(seriesLine) > contentWidth && seriesFontSize > 5) {
    seriesFontSize -= 0.5;
    doc.setFontSize(seriesFontSize);
  }
  doc.text(seriesLine, pageW / 2, marginTop + seriesFontSize * 0.35, { align: "center" });

  // Main lines - bold, larger font, vertically centered in remaining space
  if (mainLines.length === 0) return;

  const topZone = marginTop + seriesFontSize * 0.35 + 1.5; // after series line
  const availableHeight = pageH - topZone - marginTop;

  doc.setFont("Roboto", "bold");
  // Start with large font and scale down
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
  const startY = topZone + (availableHeight - totalTextHeight) / 2 + lineHeight * 0.7;

  mainLines.forEach((line, i) => {
    doc.text(line, pageW / 2, startY + i * lineHeight, { align: "center" });
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
