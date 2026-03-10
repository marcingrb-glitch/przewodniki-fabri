import { DecodedSKU } from "@/types";
import { createDoc, addHeader, addTable, toBlob } from "@/utils/pdfHelpers";
import { formatFoamsDetailed } from "@/utils/foamHelpers";

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
  y += 8;

  // Separator line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);
  y += 3;

  // Variant image (reduced to 60mm)
  const imageX = 15;
  const imageW = 180;
  const imageH = 60;

  if (variantImageUrl) {
    try {
      const response = await fetch(variantImageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = base64;
      });

      doc.setFillColor(245, 245, 245);
      doc.rect(imageX, y, imageW, imageH, "F");

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

  y += imageH + 4;

  const fs = 8;
  const rh = 6;
  const sp = 4;

  // 1. TKANINA
  y = addTable(doc, y,
    ["TKANINA", "Kod", "Nazwa", "Kolor", "Grupa"],
    [[
      "",
      `${decoded.fabric.code}${decoded.fabric.color}`,
      decoded.fabric.name,
      `${decoded.fabric.color} - ${decoded.fabric.colorName}`,
      `${decoded.fabric.group}`,
    ]],
    { 0: { cellWidth: 0 } }, sp, fs, rh
  );

  // 2. SIEDZISKO — STOLARKA
  const seatFrameRows: string[][] = [[
    decoded.seat.code,
    decoded.seat.type || "-",
    decoded.seat.frame || "-",
    decoded.seat.frameModification || "-",
    decoded.seat.springType || "-",
    `${decoded.seat.finish} (${decoded.seat.finishName})`,
  ]];
  y = addTable(doc, y,
    ["SIEDZISKO — STOLARKA", "Typ", "Stelaż", "Modyfikacja", "Sprężyna", "Wykończenie"],
    seatFrameRows,
    undefined, sp, fs, rh
  );

  // 3. SIEDZISKO — PIANKI
  const seatFoamLines = formatFoamsDetailed(decoded.seat.foams);
  const seatFoamText = seatFoamLines.length > 0 ? seatFoamLines.join("\n") : decoded.seat.foam || "-";
  const midStripText = decoded.seat.midStrip ? "TAK" : "NIE";
  y = addTable(doc, y,
    ["SIEDZISKO — PIANKI", "Front", "Pasek środkowy"],
    [[seatFoamText, decoded.seat.front || "-", midStripText]],
    { 0: { cellWidth: 100 } }, sp, fs, rh
  );

  // 4. OPARCIE
  const backFoamLines = formatFoamsDetailed(decoded.backrest.foams);
  const backFoamText = backFoamLines.length > 0 ? backFoamLines.join("\n") : decoded.backrest.foam || "-";
  y = addTable(doc, y,
    ["OPARCIE", "Wys.", "Stelaż", "Góra", "Sprężyna", "Wykończenie", "Pianki"],
    [[
      `${decoded.backrest.code}`,
      `${decoded.backrest.height}cm`,
      decoded.backrest.frame || "-",
      decoded.backrest.top || "-",
      decoded.backrest.springType || "-",
      `${decoded.backrest.finish} (${decoded.backrest.finishName})`,
      backFoamText,
    ]],
    undefined, sp, fs, rh
  );

  // 5. BOCZEK
  y = addTable(doc, y,
    ["BOCZEK", "Nazwa", "Stelaż", "Wykończenie"],
    [[
      `${decoded.side.code}`,
      decoded.side.name,
      decoded.side.frame || "-",
      `${decoded.side.finish} (${decoded.side.finishName})`,
    ]],
    undefined, sp, fs, rh
  );

  // 6. SKRZYNIA + AUTOMAT
  y = addTable(doc, y,
    ["SKRZYNIA", "Nazwa", "AUTOMAT", "Nazwa", "Typ"],
    [[
      decoded.chest.code,
      decoded.chest.name || "-",
      decoded.automat.code,
      decoded.automat.name,
      decoded.automat.type || "-",
    ]],
    undefined, sp, fs, rh
  );

  // 7. NÓŻKI
  const chestLeg = decoded.legHeights.sofa_chest;
  const seatLeg = decoded.legHeights.sofa_seat;
  const legsRows: string[][] = [];
  if (decoded.legs) {
    legsRows.push([
      "Typ nóżki",
      `${decoded.legs.code}${decoded.legs.color || ""} - ${decoded.legs.name}`,
      decoded.legs.material || "-",
      decoded.legs.colorName || "-",
    ]);
  }
  legsRows.push([
    "Pod skrzynią",
    chestLeg ? `${chestLeg.leg} H ${chestLeg.height}cm` : "-",
    chestLeg ? `${chestLeg.count} szt` : "-",
    "",
  ]);
  legsRows.push([
    "Pod siedziskiem",
    seatLeg ? `${seatLeg.leg} H ${seatLeg.height}cm` : "BRAK",
    seatLeg ? `${seatLeg.count} szt` : "-",
    "",
  ]);
  y = addTable(doc, y,
    ["NÓŻKI", "Wartość", "Ilość/Materiał", "Kolor"],
    legsRows,
    { 0: { cellWidth: 30 } }, sp, fs, rh
  );

  // 8. DODATKI
  const extraRows: string[][] = [];
  if (decoded.pillow) {
    extraRows.push(["Poduszka", `${decoded.pillow.code} - ${decoded.pillow.name.replace(/^Poduszka\s+/i, "")}`, `${decoded.pillow.finish} (${decoded.pillow.finishName})`]);
  }
  if (decoded.jaski) {
    extraRows.push(["Jaśki", `${decoded.jaski.code} - ${decoded.jaski.name}`, `${decoded.jaski.finish} (${decoded.jaski.finishName})`]);
  }
  if (decoded.walek) {
    extraRows.push(["Wałek", decoded.walek.code, `${decoded.walek.finish} (${decoded.walek.finishName})`]);
  }
  decoded.extras.forEach(e => {
    extraRows.push([e.name, e.code, e.type || "-"]);
  });
  if (extraRows.length > 0) {
    y = addTable(doc, y,
      ["DODATKI", "Kod / Nazwa", "Wykończenie / Typ"],
      extraRows,
      { 0: { cellWidth: 25 } }, sp, fs, rh
    );
  }

  // 9. PUFA (conditional)
  if (decoded.pufaSKU) {
    const pufaRows: string[][] = [["SKU pufy", decoded.pufaSKU]];
    if (decoded.pufaSeat) {
      pufaRows.push(["Przód/Tył", decoded.pufaSeat.frontBack || "-"]);
      pufaRows.push(["Boki", decoded.pufaSeat.sides || "-"]);
      pufaRows.push(["Pianka", decoded.pufaSeat.foam || "-"]);
      pufaRows.push(["Skrzynka", decoded.pufaSeat.box || "-"]);
    }
    if (decoded.pufaLegs) {
      pufaRows.push(["Nóżki pufy", `${decoded.pufaLegs.code} H ${decoded.pufaLegs.height}cm (${decoded.pufaLegs.count} szt)`]);
    }
    y = addTable(doc, y,
      ["PUFA", "Wartość"],
      pufaRows,
      { 0: { cellWidth: 30 } }, sp, fs, rh
    );
  }

  // 10. FOTEL (conditional)
  if (decoded.fotelSKU) {
    const fotelRows: string[][] = [["SKU fotela", decoded.fotelSKU]];
    if (decoded.fotelLegs) {
      fotelRows.push(["Nóżki fotela", `${decoded.fotelLegs.code} H ${decoded.fotelLegs.height}cm (${decoded.fotelLegs.count} szt)`]);
    }
    y = addTable(doc, y,
      ["FOTEL", "Wartość"],
      fotelRows,
      { 0: { cellWidth: 30 } }, sp, fs, rh
    );
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
