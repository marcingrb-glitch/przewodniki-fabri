import { DecodedSKU } from "@/types";
import { createDoc, addHeader } from "@/utils/pdfHelpers";

export function generateDecodingPDF(decoded: DecodedSKU): Blob {
  const doc = createDoc("portrait", "a4");
  const seriesInfo = `${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`;
  const orderNumber = decoded.orderNumber || "";
  const date = decoded.orderDate || "";

  let y = addHeader(doc, orderNumber, seriesInfo, date);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DEKODOWANIE SKU", 15, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`SKU: ${decoded.rawSKU || ""}`, 15, y);
  y += 6;
  doc.text(`Numer zamowienia: ${orderNumber}`, 15, y);
  y += 6;
  doc.text(`Data: ${date}`, 15, y);
  y += 10;

  // Main components
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("GLOWNE KOMPONENTY:", 15, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const lineH = 5;

  const items = [
    `Seria: ${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`,
    `Tkanina: ${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, kolor ${decoded.fabric.colorName}`,
    `Siedzisko: ${decoded.seat.code} - ${decoded.seat.typeName}`,
    `  Wykonczenie: ${decoded.seat.finish} (${decoded.seat.finishName})`,
    `Boczek: ${decoded.side.code}${decoded.side.finish} - ${decoded.side.name}`,
    `  Wykonczenie: ${decoded.side.finish} (${decoded.side.finishName})`,
    `Oparcie: ${decoded.backrest.code}${decoded.backrest.finish} - ${decoded.backrest.height}cm`,
    `  Wykonczenie: ${decoded.backrest.finish} (${decoded.backrest.finishName})`,
    `Skrzynia: ${decoded.chest.code}`,
    `Automat: ${decoded.automat.code} - ${decoded.automat.name}`,
  ];

  if (decoded.legs) {
    items.push(`Nozki: ${decoded.legs.code}${decoded.legs.color || ""} - ${decoded.legs.name} ${decoded.legs.material}${decoded.legs.colorName ? `, ${decoded.legs.colorName}` : ""}`);
  }

  items.forEach(item => {
    doc.text(`• ${item}`, 18, y);
    y += lineH;
  });

  // Extras
  if (decoded.pillow || decoded.jaski || decoded.walek || decoded.extras.length > 0) {
    y += 3;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DODATKI:", 15, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    if (decoded.pillow) {
      doc.text(`• Poduszka oparciowa: ${decoded.pillow.code} - ${decoded.pillow.name}`, 18, y);
      y += lineH;
      doc.text(`  Wykonczenie: ${decoded.pillow.finish} (jak siedzisko)`, 18, y);
      y += lineH;
    }
    if (decoded.jaski) {
      doc.text(`• Jaski: ${decoded.jaski.code} - ${decoded.jaski.name}`, 18, y);
      y += lineH;
      doc.text(`  Wykonczenie: ${decoded.jaski.finish} (jak poduszka)`, 18, y);
      y += lineH;
    }
    if (decoded.walek) {
      doc.text(`• Walek: ${decoded.walek.code}`, 18, y);
      y += lineH;
      doc.text(`  Wykonczenie: ${decoded.walek.finish} (jak poduszka)`, 18, y);
      y += lineH;
    }
    decoded.extras.forEach(e => {
      doc.text(`• ${e.name}: ${e.code}`, 18, y);
      y += lineH;
    });
  }

  // Leg heights
  y += 3;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("NOZKI - SOFA:", 15, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const chestLeg = decoded.legHeights.sofa_chest;
  const seatLeg = decoded.legHeights.sofa_seat;
  doc.text(`• Pod skrzynia: ${chestLeg ? `${chestLeg.leg} H ${chestLeg.height}cm (${chestLeg.count} szt)` : "-"}`, 18, y);
  y += lineH;
  doc.text(`• Pod siedziskiem: ${seatLeg ? `${seatLeg.leg} H ${seatLeg.height}cm (${seatLeg.count} szt)` : "BRAK"}`, 18, y);
  y += lineH;

  // Pufa/Fotel SKU
  if (decoded.pufaSKU) {
    y += 3;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DODATKI - PUFA:", 15, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`• SKU pufy: ${decoded.pufaSKU}`, 18, y);
    y += lineH;
    if (decoded.legs) {
      doc.text(`• Nozki pufy: ${decoded.legs.code}${decoded.legs.color || ""} H 16cm (4 szt)`, 18, y);
      y += lineH;
    }
  }

  if (decoded.fotelSKU) {
    y += 3;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DODATKI - FOTEL:", 15, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`• SKU fotela: ${decoded.fotelSKU}`, 18, y);
    y += lineH;
    if (decoded.legs) {
      doc.text(`• Nozki fotela: ${decoded.legs.code}${decoded.legs.color || ""} H 16cm (4 szt)`, 18, y);
    }
  }

  return doc.output("blob");
}
