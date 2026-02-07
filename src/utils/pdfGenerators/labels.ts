import { DecodedSKU } from "@/types";
import { createDoc, addLabel, toBlob } from "@/utils/pdfHelpers";
import { SEATS_PUFA } from "@/data/mappings";

function seriesLine(decoded: DecodedSKU): string {
  return `[${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]]`;
}

export async function generateSofaLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("landscape", [100, 30]);
  const s = seriesLine(decoded);
  const orderNum = decoded.orderNumber || "";
  const chestLeg = decoded.legHeights.sofa_chest;
  const seatLeg = decoded.legHeights.sofa_seat;

  // 1. Siedzisko
  addLabel(doc, [s, `SOFA | Numer zam: ${orderNum}`, `Siedzisko: ${decoded.seat.code}`, `Automat: ${decoded.automat.code}`], true);

  // 2. Oparcie
  addLabel(doc, [s, `SOFA | Numer zam: ${orderNum}`, `Oparcie: ${decoded.backrest.code}${decoded.backrest.finish}`], false);

  // 3. Boczek (first)
  addLabel(doc, [s, `SOFA | Numer zam: ${orderNum}`, `Boczek: ${decoded.side.code}${decoded.side.finish}`], false);

  // 4. Boczek (second copy)
  addLabel(doc, [s, `SOFA | Numer zam: ${orderNum}`, `Boczek: ${decoded.side.code}${decoded.side.finish}`], false);

  // 5. Skrzynia + Automat
  addLabel(doc, [s, `SOFA | Numer zam: ${orderNum}`, `Skrzynia: ${decoded.chest.code}`, `Automat: ${decoded.automat.code}`], false);

  // 6. Nóżki pod skrzynią
  const chestLegStr = chestLeg ? `${chestLeg.leg} H=${chestLeg.height}cm` : "N4 H=2.5cm";
  addLabel(doc, [s, `Numer zam: ${orderNum}`, `Noga skrzynia: ${chestLegStr}`, `Ilość: ${chestLeg?.count || 4} szt`], false);

  // 7. Nóżki pod siedziskiem (only AT1)
  if (seatLeg) {
    addLabel(doc, [s, `Numer zam: ${orderNum}`, `Noga siedzisko: ${seatLeg.leg} H=${seatLeg.height}cm`, `Ilość: ${seatLeg.count} szt`], false);
  }

  return toBlob(doc);
}

export async function generatePufaLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("landscape", [100, 30]);
  const s = seriesLine(decoded);
  const orderNum = decoded.orderNumber || "";
  const pufaSeat = SEATS_PUFA[decoded.seat.code];

  // 1. Siedzisko + Pianka
  addLabel(doc, [s, `PUFA | Numer zam: ${orderNum}`, `Siedzisko: ${decoded.seat.code}`, `Pianka bazowa: ${pufaSeat?.foam || "-"}`], true);

  // 2. Skrzynka
  addLabel(doc, [s, `PUFA | Numer zam: ${orderNum}`, `Skrzynka: ${pufaSeat?.box || "-"}`], false);

  // 3. Nóżki
  if (decoded.legs) {
    addLabel(doc, [s, `PUFA | Numer zam: ${orderNum}`, `Noga: ${decoded.legs.code}${decoded.legs.color || ""} H=16cm`, `Ilość: 4 szt`], false);
  }

  return toBlob(doc);
}

export async function generateFotelLabelsPDF(decoded: DecodedSKU): Promise<Blob> {
  const doc = await createDoc("landscape", [100, 30]);
  const s = seriesLine(decoded);
  const orderNum = decoded.orderNumber || "";

  // 1. Siedzisko
  addLabel(doc, [s, `FOTEL | Numer zam: ${orderNum}`, `Siedzisko: ${decoded.seat.code}`], true);

  // 2. Boczki
  addLabel(doc, [s, `FOTEL | Numer zam: ${orderNum}`, `Boczek: ${decoded.side.code}${decoded.side.finish}`], false);

  // 3. Nóżki
  if (decoded.legs) {
    addLabel(doc, [s, `FOTEL | Numer zam: ${orderNum}`, `Noga: ${decoded.legs.code}${decoded.legs.color || ""} H=16cm`, `Ilość: 4 szt`], false);
  }

  return toBlob(doc);
}
