import { DecodedSKU } from "@/types";
import { createDoc, addHeader, toBlob } from "@/utils/pdfHelpers";
import autoTable from "jspdf-autotable";

export async function generateDecodingPDF(
  decoded: DecodedSKU,
  variantImageUrl?: string
): Promise<Blob> {
  const doc = await createDoc("portrait", "a4");
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date);

  // SKU - large font
  doc.setFontSize(13);
  doc.setFont("Roboto", "bold");
  doc.text(`SKU: ${decoded.rawSKU || ""}`, 105, y, { align: "center" });
  y += 10;

  // Separator line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);
  y += 5;

  // Full-width image
  const imageX = 15;
  const imageW = 180; // full page width minus margins
  const imageH = 90;

  if (variantImageUrl) {
    try {
      const response = await fetch(variantImageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Get natural dimensions
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = base64;
      });

      // Draw grey background
      doc.setFillColor(245, 245, 245);
      doc.rect(imageX, y, imageW, imageH, "F");

      // Calculate proportional fit
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

  y += imageH + 5;

  // Two-column layout below image
  const colGap = 4;
  const leftColX = 15;
  const colW = (180 - colGap) / 2;
  const rightColX = leftColX + colW + colGap;

  const tableStyles = {
    font: "Roboto" as const,
    fontSize: 8,
    cellPadding: 1.5,
    overflow: "linebreak" as const,
    textColor: [0, 0, 0] as [number, number, number],
    lineWidth: 0.3,
    lineColor: [0, 0, 0] as [number, number, number],
  };
  const headStyle = { fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontStyle: "bold" as const };
  const bodyStyle = { fillColor: [255, 255, 255] as [number, number, number] };

  // LEFT COLUMN: Main components
  const mainRows: string[][] = [
    ["Seria", `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`],
    ["Tkanina", `${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, ${decoded.fabric.colorName}`],
    ["Siedzisko", `${decoded.seat.code} - ${decoded.seat.type || '?'}`],
    ["  Wykończenie", `${decoded.seat.finish} (${decoded.seat.finishName})`],
    ["Boczek", `${decoded.side.code}${decoded.side.finish} - ${decoded.side.name}`],
    ["  Wykończenie", `${decoded.side.finish} (${decoded.side.finishName})`],
    ["Oparcie", `${decoded.backrest.code}${decoded.backrest.finish} - ${decoded.backrest.height}cm`],
    ["  Wykończenie", `${decoded.backrest.finish} (${decoded.backrest.finishName})`],
    ["Skrzynia", decoded.chest.code],
    ["Automat", `${decoded.automat.code} - ${decoded.automat.name}`],
  ];

  if (decoded.legs) {
    mainRows.push(["Nóżki", `${decoded.legs.code}${decoded.legs.color || ""} - ${decoded.legs.name} ${decoded.legs.material}${decoded.legs.colorName ? `, ${decoded.legs.colorName}` : ""}`]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: leftColX, right: 195 - leftColX - colW },
    tableWidth: colW,
    head: [["GŁÓWNE KOMPONENTY", ""]],
    body: mainRows,
    theme: "grid",
    styles: tableStyles,
    headStyles: headStyle,
    bodyStyles: bodyStyle,
    alternateRowStyles: bodyStyle,
    columnStyles: { 0: { cellWidth: 25, fontStyle: "bold" } },
  });

  const leftEndY = (doc as any).lastAutoTable.finalY;

  // RIGHT COLUMN: Extras + Legs + Pufa/Fotel
  const rightRows: string[][] = [];

  // Extras
  if (decoded.pillow) {
    rightRows.push(["Poduszka", `${decoded.pillow.code} - ${decoded.pillow.name}`]);
    rightRows.push(["  Wykończenie", `${decoded.pillow.finish} (${decoded.pillow.finishName})`]);
  }
  if (decoded.jaski) {
    rightRows.push(["Jaśki", `${decoded.jaski.code} - ${decoded.jaski.name}`]);
    rightRows.push(["  Wykończenie", `${decoded.jaski.finish} (${decoded.jaski.finishName})`]);
  }
  if (decoded.walek) {
    rightRows.push(["Wałek", decoded.walek.code]);
    rightRows.push(["  Wykończenie", `${decoded.walek.finish} (${decoded.walek.finishName})`]);
  }
  decoded.extras.forEach(e => {
    rightRows.push([e.name, e.code]);
  });

  // Leg heights
  const chestLeg = decoded.legHeights.sofa_chest;
  const seatLeg = decoded.legHeights.sofa_seat;
  rightRows.push(["NÓŻKI SOFA", ""]);
  rightRows.push(["Pod skrzynią", chestLeg ? `${chestLeg.leg} H ${chestLeg.height}cm (${chestLeg.count} szt)` : "-"]);
  rightRows.push(["Pod siedziskiem", seatLeg ? `${seatLeg.leg} H ${seatLeg.height}cm (${seatLeg.count} szt)` : "BRAK"]);

  // Pufa
  if (decoded.pufaSKU) {
    rightRows.push(["PUFA", ""]);
    rightRows.push(["SKU pufy", decoded.pufaSKU]);
    if (decoded.legs) {
      rightRows.push(["Nóżki pufy", `${decoded.legs.code}${decoded.legs.color || ""} H 16cm (4 szt)`]);
    }
  }

  // Fotel
  if (decoded.fotelSKU) {
    rightRows.push(["FOTEL", ""]);
    rightRows.push(["SKU fotela", decoded.fotelSKU]);
    if (decoded.legs) {
      rightRows.push(["Nóżki fotela", `${decoded.legs.code}${decoded.legs.color || ""} H 16cm (4 szt)`]);
    }
  }

  if (rightRows.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: rightColX, right: 15 },
      tableWidth: colW,
      head: [["DODATKI / NÓŻKI", ""]],
      body: rightRows,
      theme: "grid",
      styles: tableStyles,
      headStyles: headStyle,
      bodyStyles: bodyStyle,
      alternateRowStyles: bodyStyle,
      columnStyles: { 0: { cellWidth: 25, fontStyle: "bold" } },
    });
  }

  return toBlob(doc);
}

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
