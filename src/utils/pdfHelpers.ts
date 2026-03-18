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
  spacing: number = 8,
  fontSize: number = 10,
  minCellHeight: number = 8,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const tableWidth = pageWidth - 2 * margin;
  return addTableAt(doc, y, headers, rows, margin, tableWidth, columnStyles, spacing, fontSize, minCellHeight);
}

export function addTableAt(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
  xStart: number,
  tableWidth: number,
  columnStyles?: ColumnStyles,
  spacing: number = 8,
  fontSize: number = 10,
  minCellHeight: number = 8,
): number {
  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    theme: "grid",
    tableWidth: tableWidth,
    margin: { left: xStart, right: doc.internal.pageSize.getWidth() - xStart - tableWidth },
    columnStyles: columnStyles || {},
    styles: {
      font: "Roboto",
      fontSize,
      cellPadding: 2.5,
      overflow: "linebreak",
      minCellHeight,
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

  return (doc as any).lastAutoTable.finalY + spacing;
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

export interface LabelSettings {
  leftZoneWidth: number;
  leftZoneFields: string[];
  headerTemplate: string;
  seriesCodeSize: number;
  seriesNameSize: number;
  seriesCollectionSize: number;
  contentMaxSize: number;
  contentMinSize: number;
  headerFontSize: number;
}

const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  leftZoneWidth: 16,
  leftZoneFields: ["series.code", "series.name", "series.collection"],
  headerTemplate: "{TYPE} | Zam: {ORDER}",
  seriesCodeSize: 18,
  seriesNameSize: 9,
  seriesCollectionSize: 7,
  contentMaxSize: 14,
  contentMinSize: 7,
  headerFontSize: 6,
};

/** Resolve a left-zone field value from label context */
function resolveLeftField(
  field: string,
  seriesCode: string,
  seriesName: string,
  seriesCollection: string,
  productType: string,
  orderNumber: string
): string {
  switch (field) {
    case "series.code": return seriesCode;
    case "series.name": return seriesName;
    case "series.collection": return seriesCollection ? `[${seriesCollection}]` : "";
    case "product_type": return productType.toUpperCase();
    case "order_number": return orderNumber;
    default: return "";
  }
}

/** Get font size for a left-zone field based on its type */
function getLeftFieldFontSize(field: string, settings: LabelSettings): number {
  if (field === "series.code") return settings.seriesCodeSize;
  if (field === "series.name") return settings.seriesNameSize;
  return settings.seriesCollectionSize;
}

/** Get font style for a left-zone field */
function getLeftFieldFontStyle(field: string): "bold" | "normal" {
  if (field === "series.code" || field === "series.name") return "bold";
  return "normal";
}

export function addLabel(
  doc: jsPDF,
  lines: string[],
  isFirst: boolean,
  settings?: LabelSettings
) {
  const s = settings || DEFAULT_LABEL_SETTINGS;

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

  // --- Left rotated zone ---
  const leftZoneWidth = s.leftZoneWidth;
  const maxSeriesLen = pageH - 2 * marginY;

  // Parse series text: "S1|Sofa Mar|Viena|SOFA|12345"
  const parts = seriesText.split("|");

  // Render each field in left zone
  let nextX = 1;
  for (let fi = 0; fi < s.leftZoneFields.length; fi++) {
    const fieldValue = parts[fi] || "";
    if (!fieldValue) continue;

    const field = s.leftZoneFields[fi];
    const fontStyle = getLeftFieldFontStyle(field);
    let fontSize = getLeftFieldFontSize(field, s);

    doc.setFont("Roboto", fontStyle);
    doc.setFontSize(fontSize);
    while (doc.getTextWidth(fieldValue) > maxSeriesLen && fontSize > 4) {
      fontSize -= 0.5;
      doc.setFontSize(fontSize);
    }

    // Rotated 90° text extends LEFT from anchor — offset by font height
    const fontHeightMm = fontSize * 0.35;
    const x = nextX + fontHeightMm;
    const y = pageH / 2 + doc.getTextWidth(fieldValue) / 2;
    doc.text(fieldValue, x, y, { angle: 90 });
    nextX = x + 1;
  }

  // --- Main content (shifted right) ---
  if (mainLines.length === 0) return;

  const contentLeft = leftZoneWidth;
  const contentRight = pageW - 3;
  const contentWidth = contentRight - contentLeft;
  const contentCenterX = contentLeft + contentWidth / 2;
  const availableHeight = pageH - 2 * marginY;

  // --- Header line (first of mainLines) rendered smaller at top ---
  const headerLine = mainLines[0];
  const contentLines = mainLines.slice(1);
  const headerFontSize = 6;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(headerFontSize);
  const headerY = marginY + headerFontSize * 0.4;
  doc.text(headerLine, contentCenterX, headerY, { align: "center" });

  // --- Content lines below header ---
  if (contentLines.length === 0) return;

  const headerSpace = headerFontSize * 0.55 + 1;
  const contentAvailableHeight = availableHeight - headerSpace;

  doc.setFont("Roboto", "bold");
  let mainFontSize = Math.min(s.contentMaxSize, contentAvailableHeight / contentLines.length * 2);
  let fits = false;
  while (!fits && mainFontSize > s.contentMinSize) {
    doc.setFontSize(mainFontSize);
    fits = contentLines.every(line => doc.getTextWidth(line) <= contentWidth);
    if (!fits) mainFontSize -= 0.5;
  }

  doc.setFontSize(mainFontSize);
  const lineHeight = mainFontSize * 0.55;
  const totalTextHeight = contentLines.length * lineHeight;
  const contentStartY = marginY + headerSpace + (contentAvailableHeight - totalTextHeight) / 2 + lineHeight * 0.7;

  contentLines.forEach((line, i) => {
    doc.text(line, contentCenterX, contentStartY + i * lineHeight, { align: "center" });
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
