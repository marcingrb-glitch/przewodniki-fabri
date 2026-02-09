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

  // Layout: image left (80mm), components right
  const imageX = 15;
  const imageY = y;
  const imageW = 70;
  const imageH = 70;
  const componentsX = imageX + imageW + 5;
  const componentsW = 195 - componentsX;

  // Draw image or placeholder
  if (variantImageUrl) {
    try {
      const response = await fetch(variantImageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, "JPEG", imageX, imageY, imageW, imageH);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(imageX, imageY, imageW, imageH);
    } catch (error) {
      console.error("Error adding image to PDF:", error);
      drawPlaceholder(doc, imageX, imageY, imageW, imageH);
    }
  } else {
    drawPlaceholder(doc, imageX, imageY, imageW, imageH);
  }

  // Components table on the right
  const mainRows: string[][] = [
    ["Seria", `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`],
    ["Tkanina", `${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, ${decoded.fabric.colorName}`],
    ["Siedzisko", `${decoded.seat.code} - ${decoded.seat.typeName}`],
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
    startY: imageY,
    margin: { left: componentsX, right: 15 },
    tableWidth: componentsW,
    head: [["GŁÓWNE KOMPONENTY", ""]],
    body: mainRows,
    theme: "grid",
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 1.5,
      overflow: "linebreak",
      textColor: [0, 0, 0],
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
    },
  });

  const mainTableEndY = (doc as any).lastAutoTable.finalY;

  // Extras section below the image/components area
  let extrasY = Math.max(imageY + imageH + 5, mainTableEndY + 5);

  const hasExtras = decoded.pillow || decoded.jaski || decoded.walek || decoded.extras.length > 0;

  if (hasExtras) {
    const extrasRows: string[][] = [];
    if (decoded.pillow) {
      extrasRows.push(["Poduszka", `${decoded.pillow.code} - ${decoded.pillow.name}`]);
      extrasRows.push(["  Wykończenie", `${decoded.pillow.finish} (${decoded.pillow.finishName})`]);
    }
    if (decoded.jaski) {
      extrasRows.push(["Jaśki", `${decoded.jaski.code} - ${decoded.jaski.name}`]);
      extrasRows.push(["  Wykończenie", `${decoded.jaski.finish} (${decoded.jaski.finishName})`]);
    }
    if (decoded.walek) {
      extrasRows.push(["Wałek", decoded.walek.code]);
      extrasRows.push(["  Wykończenie", `${decoded.walek.finish} (${decoded.walek.finishName})`]);
    }
    decoded.extras.forEach(e => {
      extrasRows.push([e.name, e.code]);
    });

    autoTable(doc, {
      startY: extrasY,
      margin: { left: 15, right: 15 },
      head: [["DODATKI", ""]],
      body: extrasRows,
      theme: "grid",
      styles: {
        font: "Roboto",
        fontSize: 8,
        cellPadding: 1.5,
        overflow: "linebreak",
        textColor: [0, 0, 0],
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      bodyStyles: { fillColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: "bold" },
      },
    });

    extrasY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Leg heights
  const legRows: string[][] = [];
  const chestLeg = decoded.legHeights.sofa_chest;
  const seatLeg = decoded.legHeights.sofa_seat;
  legRows.push(["Pod skrzynią", chestLeg ? `${chestLeg.leg} H ${chestLeg.height}cm (${chestLeg.count} szt)` : "-"]);
  legRows.push(["Pod siedziskiem", seatLeg ? `${seatLeg.leg} H ${seatLeg.height}cm (${seatLeg.count} szt)` : "BRAK"]);

  autoTable(doc, {
    startY: extrasY,
    margin: { left: 15, right: 15 },
    head: [["NÓŻKI - SOFA", ""]],
    body: legRows,
    theme: "grid",
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 1.5,
      overflow: "linebreak",
      textColor: [0, 0, 0],
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    bodyStyles: { fillColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: "bold" },
    },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 5;

  // Pufa/Fotel
  if (decoded.pufaSKU) {
    const pufaRows: string[][] = [
      ["SKU pufy", decoded.pufaSKU],
    ];
    if (decoded.legs) {
      pufaRows.push(["Nóżki pufy", `${decoded.legs.code}${decoded.legs.color || ""} H 16cm (4 szt)`]);
    }
    autoTable(doc, {
      startY: finalY,
      margin: { left: 15, right: 15 },
      head: [["DODATKI - PUFA", ""]],
      body: pufaRows,
      theme: "grid",
      styles: { font: "Roboto", fontSize: 8, cellPadding: 1.5, textColor: [0, 0, 0], lineWidth: 0.3, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold" },
      bodyStyles: { fillColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 35, fontStyle: "bold" } },
    });
    finalY = (doc as any).lastAutoTable.finalY + 5;
  }

  if (decoded.fotelSKU) {
    const fotelRows: string[][] = [
      ["SKU fotela", decoded.fotelSKU],
    ];
    if (decoded.legs) {
      fotelRows.push(["Nóżki fotela", `${decoded.legs.code}${decoded.legs.color || ""} H 16cm (4 szt)`]);
    }
    autoTable(doc, {
      startY: finalY,
      margin: { left: 15, right: 15 },
      head: [["DODATKI - FOTEL", ""]],
      body: fotelRows,
      theme: "grid",
      styles: { font: "Roboto", fontSize: 8, cellPadding: 1.5, textColor: [0, 0, 0], lineWidth: 0.3, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold" },
      bodyStyles: { fillColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 35, fontStyle: "bold" } },
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
