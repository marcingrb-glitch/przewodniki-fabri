import jsPDF from "jspdf";

export function createDoc(orientation: "portrait" | "landscape" = "portrait", format: number[] | string = "a4"): jsPDF {
  return new jsPDF({ orientation, unit: "mm", format });
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
  doc.setFont("helvetica", "bold");
  const title = prefix ? `${prefix} | NUMER ZAMÓWIENIA: ${orderNumber}` : `NUMER ZAMÓWIENIA: ${orderNumber}`;
  doc.text(title, left, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`[${seriesInfo}]`, right, 20, { align: "right" });

  doc.setFontSize(9);
  doc.text(`Data zlozenia zamowienia: ${date}`, left, 27);

  return 32; // y position after header
}

export function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.setTextColor(255, 255, 255);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.rect(15, y, pageWidth - 30, 7, "F");
  doc.text(title, 18, y + 5);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
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
  doc.setFont("helvetica", "bold");
  doc.rect(left, y, tableWidth, 7, "F");
  headers.forEach((h, i) => {
    doc.text(h, left + i * colWidth + cellPadding, y + 5);
  });
  y += 7;

  // Data rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
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
  doc.setFillColor(254, 243, 199); // amber-100 equivalent
  doc.rect(15, y, pageWidth - 30, 10, "F");
  doc.setDrawColor(245, 158, 11);
  doc.rect(15, y, pageWidth - 30, 10);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
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
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);

  lines.forEach((line, i) => {
    const textWidth = doc.getTextWidth(line);
    const x = (pageWidth - textWidth) / 2;
    doc.text(line, Math.max(margin, x), startY + i * lineHeight);
  });
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
