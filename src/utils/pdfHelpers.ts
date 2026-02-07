import jsPDF from "jspdf";

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

  doc.setFontSize(14);
  doc.setFont("Roboto", "bold");
  const title = prefix ? `${prefix} | NUMER ZAMÓWIENIA: ${orderNumber}` : `NUMER ZAMÓWIENIA: ${orderNumber}`;
  doc.text(title, left, 20);

  doc.setFontSize(11);
  doc.setFont("Roboto", "normal");
  doc.text(`[${seriesInfo}]`, right, 20, { align: "right" });

  doc.setFontSize(9);
  doc.text(`Data złożenia zamówienia: ${date}`, left, 27);

  return 32;
}

export function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(11);
  doc.setFont("Roboto", "bold");
  doc.setFillColor(79, 70, 229);
  doc.setTextColor(255, 255, 255);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.rect(15, y, pageWidth - 30, 7, "F");
  doc.text(title, 18, y + 5);
  doc.setTextColor(0, 0, 0);
  doc.setFont("Roboto", "normal");
  return y + 9;
}

export function addTable(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - 30;
  const colWidth = tableWidth / headers.length;
  const left = 15;
  const cellPadding = 3;
  const fontSize = 9;

  doc.setFontSize(fontSize);

  // Header row
  doc.setFillColor(79, 70, 229);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Roboto", "bold");
  doc.rect(left, y, tableWidth, 7, "F");
  headers.forEach((h, i) => {
    doc.text(h, left + i * colWidth + cellPadding, y + 5);
  });
  y += 7;

  // Data rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("Roboto", "normal");
  rows.forEach((row, rowIdx) => {
    const bgColor = rowIdx % 2 === 0 ? 245 : 255;
    doc.setFillColor(bgColor, bgColor, bgColor);
    doc.rect(left, y, tableWidth, 7, "F");
    row.forEach((cell, i) => {
      const text = cell.length > 35 ? cell.substring(0, 33) + ".." : cell;
      doc.text(text, left + i * colWidth + cellPadding, y + 5);
    });
    y += 7;
  });

  // Border
  doc.setDrawColor(200, 200, 200);
  doc.rect(left, y - 7 * (rows.length + 1), tableWidth, 7 * (rows.length + 1));

  return y + 4;
}

export function addInfoBox(doc: jsPDF, y: number, text: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(254, 243, 199);
  doc.rect(15, y, pageWidth - 30, 10, "F");
  doc.setDrawColor(245, 158, 11);
  doc.rect(15, y, pageWidth - 30, 10);
  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(146, 64, 14);
  doc.text(text, 20, y + 7);
  doc.setTextColor(0, 0, 0);
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

  const pageWidth = 100;
  const pageHeight = 30;
  const margin = 5;
  const lineHeight = 5;
  const totalTextHeight = lines.length * lineHeight;
  let startY = (pageHeight - totalTextHeight) / 2 + lineHeight * 0.7;
  if (startY < margin) startY = margin + lineHeight * 0.7;

  doc.setFontSize(8);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);

  lines.forEach((line, i) => {
    const textWidth = doc.getTextWidth(line);
    const x = (pageWidth - textWidth) / 2;
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
