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
  const left = 20;
  const right = pageWidth - 20;

  doc.setFontSize(12);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  const title = prefix ? `${prefix} | NUMER ZAMÓWIENIA: ${orderNumber}` : `NUMER ZAMÓWIENIA: ${orderNumber}`;
  doc.text(title, left, 20);

  doc.setFontSize(11);
  doc.setFont("Roboto", "normal");
  doc.text(`[${seriesInfo}]`, right, 20, { align: "right" });

  // Date - larger font, bold
  doc.setFontSize(12);
  doc.setFont("Roboto", "bold");
  doc.text(`Data złożenia zamówienia: ${date}`, left, 32);

  doc.setFont("Roboto", "normal");
  doc.setTextColor(0, 0, 0);
  return 45;
}

export function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(11);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.rect(15, y, pageWidth - 30, 7);
  doc.text(title, 18, y + 5);
  doc.setFont("Roboto", "normal");
  return y + 9;
}

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
  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    theme: "grid",
    columnStyles: columnStyles || {},
    styles: {
      font: "Roboto",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      cellWidth: "wrap",
      minCellHeight: 10,
      valign: "middle",
      halign: "left",
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineWidth: 0.7,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
  });

  return (doc as any).lastAutoTable.finalY + 6;
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

  const margin = 5;
  const contentWidth = 100 - (2 * margin);
  const contentHeight = 30 - (2 * margin);

  // Black border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, contentHeight);

  // Black text
  doc.setTextColor(0, 0, 0);
  doc.setFont("Roboto", "bold");
  doc.setFontSize(8);

  const lineHeight = 5;
  const totalTextHeight = lines.length * lineHeight;
  let startY = margin + (contentHeight - totalTextHeight) / 2 + lineHeight * 0.7;
  if (startY < margin + lineHeight * 0.7) startY = margin + lineHeight * 0.7;

  lines.forEach((line, i) => {
    const textWidth = doc.getTextWidth(line);
    const x = (100 - textWidth) / 2;
    doc.text(line, Math.max(margin, x), startY + i * lineHeight);
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
